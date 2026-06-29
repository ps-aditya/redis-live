import React, { useState, useCallback, useEffect, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ResponseEntry = {
  id: string;
  command: string;
  result?: unknown;
  error?: string;
  status: 'success' | 'error' | 'timeout';
  executionTimeMs: number;
};

type PendingCommand = {
  id: string;
  command: string;
  timeoutHandle: ReturnType<typeof setTimeout>;
};

type RedisKey = {
  name: string;
  type: 'string' | 'list' | 'set' | 'zset' | 'hash' | 'stream' | 'unknown';
  value: any;
  ttl: number | null;
};

type ConnectionStatus = 'connecting' | 'connected' | 'offline' | 'paused';

type TimelineEntry = {
  id: string;
  timestamp: number;
  command?: string;
  sourceType: 'terminal' | 'poll' | 'save-diff';
  diff: { added: string[]; modified: string[]; deleted: string[] };
  keyCountBefore: number;
  keyCountAfter: number;
};

type CommandReference = { categories: Record<string, { name: string; signature: string; description: string }[]> };
type ConnectionProfile = { id: string; name: string; url: string };

// ─── Constants ───────────────────────────────────────────────────────────────

const COMMAND_TIMEOUT_MS = 10_000;
const COMMAND_HISTORY_SIZE = 50;
const JSON_COLLAPSE_THRESHOLD = 500;

const REDIS_COMMANDS = new Set([
  'SET','GET','DEL','EXISTS','EXPIRE','TTL','PERSIST','PEXPIRE','PTTL',
  'KEYS','SCAN','TYPE','RENAME','COPY','MOVE','UNLINK','DUMP','RESTORE',
  'APPEND','STRLEN','INCR','INCRBY','INCRBYFLOAT','DECR','DECRBY','GETSET',
  'MGET','MSET','MSETNX','GETEX','GETDEL','SETNX','SETEX','PSETEX',
  'LPUSH','RPUSH','LPOP','RPOP','LLEN','LRANGE','LINDEX','LSET','LINSERT',
  'LREM','LTRIM','LMOVE','LMPOP','BLPOP','BRPOP',
  'HSET','HGET','HMSET','HMGET','HDEL','HEXISTS','HLEN','HKEYS','HVALS',
  'HGETALL','HINCRBY','HINCRBYFLOAT','HSCAN','HRANDFIELD',
  'SADD','SREM','SMEMBERS','SISMEMBER','SMISMEMBER','SCARD','SUNION',
  'SINTER','SDIFF','SUNIONSTORE','SINTERSTORE','SDIFFSTORE','SSCAN','SRANDMEMBER','SPOP',
  'ZADD','ZREM','ZSCORE','ZRANK','ZREVRANK','ZRANGE','ZRANGEBYSCORE',
  'ZRANGEBYLEX','ZREVRANGE','ZREVRANGEBYSCORE','ZCARD','ZCOUNT','ZINCRBY',
  'ZUNIONSTORE','ZINTERSTORE','ZSCAN','ZPOPMIN','ZPOPMAX','ZRANDMEMBER',
  'XADD','XREAD','XRANGE','XREVRANGE','XLEN','XTRIM','XDEL','XGROUP',
  'XREADGROUP','XACK','XCLAIM','XPENDING','XINFO',
  'MULTI','EXEC','DISCARD','WATCH','UNWATCH',
  'EVAL','EVALSHA','SCRIPT','FCALL','FUNCTION',
  'SELECT','FLUSHDB','FLUSHALL','DBSIZE','INFO','PING','ECHO','CLIENT',
  'CONFIG','COMMAND','AUTH','QUIT','RESET','HELLO','SAVE','BGSAVE',
  'BGREWRITEAOF','LASTSAVE','SHUTDOWN','SLOWLOG','TIME','MEMORY','ACL',
]);

const FLAGS = new Set(['EX','PX','EXAT','PXAT','NX','XX','GT','LT','KEEPTTL',
  'GET','COUNT','MATCH','TYPE','WITHSCORES','LIMIT','ASC','DESC','REV','BYSCORE','BYLEX']);

// ─── Tokenizer ───────────────────────────────────────────────────────────────

type Token = { text: string; kind: 'command' | 'key' | 'value' | 'number' | 'flag' | 'plain' };

function tokenize(input: string): Token[] {
  const parts = input.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
  return parts.map((text, i) => {
    const upper = text.replace(/^["']|["']$/g, '').toUpperCase();
    if (i === 0 && REDIS_COMMANDS.has(upper)) return { text, kind: 'command' };
    if (/^["']/.test(text)) return { text, kind: 'value' };
    if (/^-?\d+(\.\d+)?$/.test(text)) return { text, kind: 'number' };
    if (FLAGS.has(upper)) return { text, kind: 'flag' };
    if (i === 1) return { text, kind: 'key' };
    return { text, kind: 'plain' };
  });
}

function renderTokens(tokens: Token[]): string {
  return tokens.map((tok, i) => {
    let color = 'var(--vscode-editor-foreground)';
    let bold = false;
    switch (tok.kind) {
      case 'command': color = 'var(--vscode-symbolIcon-functionForeground, #dcdcaa)'; bold = true; break;
      case 'key':     color = 'var(--vscode-symbolIcon-variableForeground, #9cdcfe)'; break;
      case 'value':   color = 'var(--vscode-string-color, #ce9178)'; break;
      case 'number':  color = 'var(--vscode-number-color, #b5cea8)'; break;
      case 'flag':    color = 'var(--vscode-symbolIcon-keywordForeground, #c586c0)'; break;
    }
    const space = i < tokens.length - 1 ? ' ' : '';
    return `<span style="color:${color}${bold ? ';font-weight:bold' : ''}">${escHtml(tok.text)}</span>${space}`;
  }).join('');
}

function escHtml(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Response renderer ───────────────────────────────────────────────────────

function ResponseValue({ value }: { value: unknown }): React.ReactElement {
  if (value === null || value === undefined)
    return <span style={{ color: 'var(--vscode-descriptionForeground)' }}>nil</span>;
  if (typeof value === 'string')
    return <span style={{ color: 'var(--vscode-string-color, #ce9178)' }}>"{value}"</span>;
  if (typeof value === 'number')
    return <span style={{ color: 'var(--vscode-number-color, #b5cea8)' }}>{value}</span>;
  if (typeof value === 'boolean')
    return <span style={{ color: 'var(--vscode-number-color, #b5cea8)' }}>{value ? 'true' : 'false'}</span>;
  if (Array.isArray(value)) {
    return (
      <div>
        {value.map((item, idx) => (
          <div key={idx} style={{ marginLeft: 12 }}>
            <span style={{ color: 'var(--vscode-descriptionForeground)', userSelect: 'none' }}>{idx + 1}) </span>
            <ResponseValue value={item} />
          </div>
        ))}
      </div>
    );
  }
  const json = JSON.stringify(value, null, 2);
  return <JsonFallback json={json} collapsed={json.length > JSON_COLLAPSE_THRESHOLD} />;
}

function JsonFallback({ json, collapsed: init }: { json: string; collapsed: boolean }) {
  const [collapsed, setCollapsed] = useState(init);
  return (
    <span>
      <span style={{ fontSize:'0.7em', background:'var(--vscode-badge-background)', color:'var(--vscode-badge-foreground)', padding:'1px 4px', borderRadius:2, marginRight:4 }}>JSON</span>
      <span style={{ color:'var(--vscode-descriptionForeground)', whiteSpace:'pre-wrap', fontFamily:'monospace' }}>
        {collapsed ? json.slice(0, JSON_COLLAPSE_THRESHOLD) + '…' : json}
      </span>
      {init && (
        <button onClick={() => setCollapsed(c => !c)} style={{ background:'none', border:'none', color:'var(--vscode-textLink-foreground)', cursor:'pointer', fontSize:'inherit', padding:'0 4px' }}>
          {collapsed ? '[+]' : '[–]'}
        </button>
      )}
    </span>
  );
}

// ─── Command reference — FULL WIDTH, replaces state panel ────────────────────

function CommandRef({ data, onInsert, onClose }: { data: CommandReference | null; onInsert: (sig: string) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = data
    ? Object.entries(data.categories).reduce<Record<string, any[]>>((acc, [cat, cmds]) => {
        const hits = cmds.filter(c =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase())
        );
        if (hits.length) acc[cat] = hits;
        return acc;
      }, {})
    : {};

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden', borderTop:'1px solid var(--vscode-panel-border)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 10px', borderBottom:'1px solid var(--vscode-panel-border)', flexShrink:0, background:'var(--vscode-sideBar-background)' }}>
        <span style={{ fontSize:'0.75em', fontWeight:600, color:'var(--vscode-descriptionForeground)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Commands</span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--vscode-descriptionForeground)', cursor:'pointer', fontSize:'1em', padding:'0 2px' }} title="Close">✕</button>
      </div>
      {/* Search */}
      <div style={{ padding:'6px 8px', flexShrink:0, borderBottom:'1px solid var(--vscode-panel-border)' }}>
        <input
          type="text"
          placeholder="Filter…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
          style={{ width:'100%', boxSizing:'border-box', background:'var(--vscode-input-background)', color:'var(--vscode-input-foreground)', border:'1px solid var(--vscode-input-border)', borderRadius:3, padding:'4px 8px', fontSize:'0.82em', outline:'none' }}
        />
      </div>
      {/* List */}
      <div style={{ overflowY:'auto', flex:1 }}>
        {!data && <div style={{ padding:12, color:'var(--vscode-descriptionForeground)', fontSize:'0.82em' }}>Loading…</div>}
        {data && Object.keys(filtered).length === 0 && (
          <div style={{ padding:12, color:'var(--vscode-descriptionForeground)', fontSize:'0.82em' }}>No match for "{search}"</div>
        )}
        {data && Object.entries(filtered).map(([cat, cmds]) => (
          <div key={cat}>
            <div
              onClick={() => setExpanded(e => e === cat ? null : cat)}
              style={{ padding:'5px 10px', cursor:'pointer', userSelect:'none', fontSize:'0.72em', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--vscode-descriptionForeground)', background:'var(--vscode-sideBar-background)', borderBottom:'1px solid var(--vscode-panel-border)', display:'flex', justifyContent:'space-between' }}>
              {cat} <span>{expanded === cat ? '▾' : '▸'}</span>
            </div>
            {expanded === cat && cmds.map(cmd => (
              <div
                key={cmd.name}
                onClick={() => onInsert(cmd.signature)}
                style={{ padding:'6px 12px', borderBottom:'1px solid var(--vscode-panel-border)', cursor:'pointer' }}
                title="Click to insert into terminal">
                <div style={{ fontWeight:600, color:'var(--vscode-symbolIcon-functionForeground, #dcdcaa)', fontSize:'0.82em' }}>{cmd.name}</div>
                <div style={{ fontSize:'0.72em', color:'var(--vscode-descriptionForeground)', fontFamily:'monospace', marginTop:2 }}>{cmd.signature}</div>
                <div style={{ fontSize:'0.75em', color:'var(--vscode-foreground)', marginTop:3, opacity:0.85 }}>{cmd.description}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── State panel ─────────────────────────────────────────────────────────────

function StatePanel({ keys, connectionStatus, diff, highlightedKeys, deletingKeys, onDelete, onJump, saveDiff, onDismissSaveDiff, profiles, activeProfileId, onSwitchProfile, onFilter, currentDb, onDbSelect }:
  { keys: RedisKey[]; connectionStatus: ConnectionStatus; diff: any; highlightedKeys: Record<string, any>; deletingKeys: Record<string, any>; onDelete: (k: string) => void; onJump: (filename: string, line: number) => void; saveDiff: any; onDismissSaveDiff: () => void; profiles: ConnectionProfile[]; activeProfileId: string | null; onSwitchProfile: (id: string) => void; onFilter: (pattern: string) => void; currentDb: number; onDbSelect: (db: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [filterInput, setFilterInput] = useState('');
  const dot = connectionStatus === 'connected' ? '#4ec9b0' : connectionStatus === 'offline' ? '#f48771' : '#dcdcaa';
  return (
    <div style={{ borderTop:'1px solid var(--vscode-panel-border)', flexShrink:0 }}>
      {/* Header — always visible, click to expand */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 10px', cursor:'pointer', userSelect:'none', background:'var(--vscode-sideBar-background)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:dot, flexShrink:0 }} />
          <span style={{ fontSize:'0.78em', fontWeight:600, color:'var(--vscode-foreground)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            {connectionStatus === 'connected' ? `${keys.length} key${keys.length !== 1 ? 's' : ''}` : connectionStatus}
          </span>
        </div>
        <span style={{ fontSize:'0.72em', color:'var(--vscode-descriptionForeground)' }}>{expanded ? '▾' : '▸'}</span>
      </div>

      {/* Save-diff banner */}
      {saveDiff && (
        <div style={{ padding:'4px 10px', fontSize:'0.78em', background:'var(--vscode-inputValidation-warningBackground)', borderTop:'1px solid var(--vscode-inputValidation-warningBorder)', color:'var(--vscode-inputValidation-warningForeground)', display:'flex', justifyContent:'space-between', alignItems:'center' }}
          title={`Keys changed after saving ${saveDiff.filename}`}>
          <span>↓ Redis changed after save: {saveDiff.filename}</span>
          <button onClick={e => { e.stopPropagation(); onDismissSaveDiff(); }}
            style={{ background:'none', border:'none', color:'inherit', cursor:'pointer', padding:'0 4px' }}>✕</button>
        </div>
      )}

      {/* Key list */}
      {expanded && (
        <div style={{ display:'flex', flexDirection:'column', maxHeight:360 }}>
        <div style={{ padding:'4px 8px', flexShrink:0, borderBottom:'1px solid var(--vscode-panel-border)' }}>
          <input
            type="text"
            placeholder="Filter keys… (e.g. user:*, session:*)"
            value={filterInput}
            onChange={e => { setFilterInput(e.target.value); onFilter(e.target.value); }}
            style={{ width:'100%', boxSizing:'border-box', background:'var(--vscode-input-background)', color:'var(--vscode-input-foreground)', border:'1px solid var(--vscode-input-border)', borderRadius:3, padding:'3px 6px', fontSize:'0.78em', outline:'none', fontFamily:'monospace' }}
          />
        </div>
        <div style={{ overflowY:'auto', flex:1 }}>
          {connectionStatus === 'connecting' && (
            <div style={{ padding:'12px 10px', color:'var(--vscode-descriptionForeground)', fontSize:'0.82em' }}>Connecting to Redis…</div>
          )}
          {connectionStatus === 'offline' && (
            <div style={{ margin:8, padding:'8px 10px', background:'var(--vscode-inputValidation-errorBackground)', border:'1px solid var(--vscode-inputValidation-errorBorder)', borderRadius:3, fontSize:'0.82em', color:'var(--vscode-inputValidation-errorForeground)' }}>
              Redis offline — use <strong>Redis Live: Connect</strong> to reconnect
            </div>
          )}
          {(connectionStatus === 'connected' || connectionStatus === 'paused') && keys.length === 0 && (
            <div style={{ padding:'12px 10px', color:'var(--vscode-descriptionForeground)', fontSize:'0.82em' }}>
              No keys. Run <code style={{ color:'var(--vscode-symbolIcon-functionForeground, #dcdcaa)' }}>SET mykey hello</code> to add one.
            </div>
          )}
          {keys.map(key => {
            const isDeleting = !!deletingKeys[key.name];
            const isHighlighted = !!highlightedKeys[key.name];
            const isAdded = diff?.added?.includes(key.name);
            const isModified = diff?.modified?.includes(key.name);
            const ref = highlightedKeys[key.name];

            let borderColor = 'var(--vscode-panel-border)';
            if (isHighlighted) borderColor = 'var(--vscode-textLink-foreground, #4fc1ff)';
            else if (isAdded) borderColor = '#4ec9b0';
            else if (isModified) borderColor = '#dcdcaa';

            let displayValue = '';
            if (key.type === 'string') displayValue = String(key.value ?? '').slice(0, 60);
            else if (key.type === 'list') displayValue = `List · ${Array.isArray(key.value) ? key.value.length : '?'} items`;
            else if (key.type === 'hash') displayValue = `Hash · ${key.value ? Object.keys(key.value).length : '?'} fields`;
            else if (key.type === 'set') displayValue = `Set · ${Array.isArray(key.value) ? key.value.length : '?'} members`;
            else if (key.type === 'zset') displayValue = `Sorted set · ${Array.isArray(key.value) ? key.value.length / 2 : '?'} members`;
            else if (key.type === 'stream') displayValue = `Stream · ${Array.isArray(key.value) ? key.value.length : '?'} entries`;
            else displayValue = key.type;

            return (
              <div key={key.name} style={{ padding:'5px 10px', borderLeft:`2px solid ${borderColor}`, borderBottom:'1px solid var(--vscode-panel-border)', opacity: isDeleting ? 0.4 : 1, pointerEvents: isDeleting ? 'none' : 'auto', background:'var(--vscode-sideBar-background)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ flex:1, fontFamily:'monospace', fontSize:'0.82em', fontWeight:500, color:'var(--vscode-foreground)', wordBreak:'break-all' }}>{key.name}</span>
                  <span style={{ fontSize:'0.68em', padding:'1px 4px', borderRadius:2, background:'var(--vscode-badge-background)', color:'var(--vscode-badge-foreground)', flexShrink:0 }}>{key.type.toUpperCase()}</span>
                  {isHighlighted && ref && (
                    <button onClick={() => onJump(ref.filename, ref.line)}
                      title={`Jump to ${ref.filename.split(/[\\/]/).pop()}:${ref.line}`}
                      style={{ background:'none', border:'none', color:'var(--vscode-textLink-foreground, #4fc1ff)', cursor:'pointer', fontSize:'0.75em', padding:'0 2px', flexShrink:0 }}>⟨/⟩</button>
                  )}
                  {!isDeleting && (
                    <button
                      onClick={() => navigator.clipboard.writeText(key.name)}
                      title="Copy key name"
                      style={{ background:'none', border:'none', color:'var(--vscode-descriptionForeground)', cursor:'pointer', fontSize:'0.75em', padding:'0 2px', flexShrink:0, opacity:0.6 }}>⎘</button>
                  )}
                  {!isDeleting && (
                    <button onClick={() => onDelete(key.name)} title="Delete key"
                      style={{ background:'none', border:'none', color:'var(--vscode-descriptionForeground)', cursor:'pointer', fontSize:'0.82em', padding:'0 2px', flexShrink:0, opacity:0.6 }}>×</button>
                  )}
                </div>
                <div style={{ fontSize:'0.75em', color:'var(--vscode-descriptionForeground)', fontFamily:'monospace', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  <span
                    onClick={e => { e.stopPropagation(); setExpandedKey(k => k === key.name ? null : key.name); }}
                    style={{ cursor:'pointer' }}
                    title="Click to expand"
                  >
                    {isDeleting ? 'Deleting…' : displayValue}
                    {!isDeleting && <span style={{ opacity:0.4, marginLeft:4 }}>{expandedKey === key.name ? '▾' : '▸'}</span>}
                  </span>
                </div>
                {expandedKey === key.name && !isDeleting && (
                  <div style={{ marginTop:4, padding:'6px 8px', background:'var(--vscode-editor-background)', borderRadius:3, fontSize:'0.75em', fontFamily:'monospace', whiteSpace:'pre-wrap', wordBreak:'break-all', maxHeight:160, overflowY:'auto', color:'var(--vscode-editor-foreground)' }}>
                    {key.type === 'string' && <span style={{ color:'var(--vscode-string-color, #ce9178)' }}>{String(key.value ?? '')}</span>}
                    {key.type === 'list' && Array.isArray(key.value) && key.value.map((item: string, idx: number) => (
                      <div key={idx}><span style={{ color:'var(--vscode-descriptionForeground)', userSelect:'none' }}>{idx + 1}) </span><span style={{ color:'var(--vscode-string-color, #ce9178)' }}>{item}</span></div>
                    ))}
                    {key.type === 'hash' && key.value && Object.entries(key.value).map(([f, v]) => (
                      <div key={f}><span style={{ color:'var(--vscode-symbolIcon-variableForeground, #9cdcfe)' }}>{f}</span><span style={{ color:'var(--vscode-descriptionForeground)' }}> → </span><span style={{ color:'var(--vscode-string-color, #ce9178)' }}>{String(v)}</span></div>
                    ))}
                    {key.type === 'set' && Array.isArray(key.value) && key.value.map((item: string, idx: number) => (
                      <div key={idx}><span style={{ color:'var(--vscode-string-color, #ce9178)' }}>{item}</span></div>
                    ))}
                    {key.type === 'zset' && Array.isArray(key.value) && (() => {
                      const pairs = [];
                      for (let i = 0; i < key.value.length; i += 2) pairs.push([key.value[i], key.value[i+1]]);
                      return pairs.map(([member, score], idx) => (
                        <div key={idx}><span style={{ color:'var(--vscode-number-color, #b5cea8)' }}>{score}</span><span style={{ color:'var(--vscode-descriptionForeground)' }}> → </span><span style={{ color:'var(--vscode-string-color, #ce9178)' }}>{member}</span></div>
                      ));
                    })()}
                    {key.type === 'stream' && Array.isArray(key.value) && key.value.map((entry: any, idx: number) => (
                      <div key={idx} style={{ marginBottom:4 }}>
                        <div><span style={{ color:'var(--vscode-symbolIcon-functionForeground, #dcdcaa)' }}>{entry[0]}</span></div>
                        {Array.isArray(entry[1]) && (() => {
                          const fields = [];
                          for (let i = 0; i < entry[1].length; i += 2) fields.push([entry[1][i], entry[1][i+1]]);
                          return fields.map(([f, v], fi) => (
                            <div key={fi} style={{ marginLeft:8 }}><span style={{ color:'var(--vscode-symbolIcon-variableForeground, #9cdcfe)' }}>{f}</span><span style={{ color:'var(--vscode-descriptionForeground)' }}>: </span><span style={{ color:'var(--vscode-string-color, #ce9178)' }}>{v}</span></div>
                          ));
                        })()}
                      </div>
                    ))}
                    {key.type === 'unknown' && <span style={{ color:'var(--vscode-descriptionForeground)' }}>(unsupported type)</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>
      )}
    </div>
  );
}

// ─── Timeline panel ──────────────────────────────────────────────────────────

function TimelinePanel({ entries, onClose }: { entries: TimelineEntry[]; onClose: () => void }) {
  function timeAgo(ts: number) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 5) return 'just now';
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  }

  return (
    <div style={{ borderTop:'1px solid var(--vscode-panel-border)', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 10px', background:'var(--vscode-sideBar-background)', borderBottom:'1px solid var(--vscode-panel-border)' }}>
        <span style={{ fontSize:'0.75em', fontWeight:600, color:'var(--vscode-descriptionForeground)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Mutations ({entries.length})</span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--vscode-descriptionForeground)', cursor:'pointer', fontSize:'0.85em' }}>✕</button>
      </div>
      <div style={{ maxHeight:180, overflowY:'auto' }}>
        {[...entries].reverse().map(entry => (
          <div key={entry.id} style={{ padding:'5px 10px', borderBottom:'1px solid var(--vscode-panel-border)' }}>
            <div style={{ fontFamily:'monospace', fontSize:'0.78em', color:'var(--vscode-foreground)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {timeAgo(entry.timestamp)} — {entry.command ?? (entry.sourceType === 'poll' ? 'external change' : 'post-save')}
            </div>
            <div style={{ display:'flex', gap:4, marginTop:2 }}>
              {entry.diff.added.length > 0 && <span style={{ fontSize:'0.68em', padding:'1px 4px', borderRadius:2, background:'rgba(78,201,176,0.15)', color:'#4ec9b0' }}>+{entry.diff.added.length}</span>}
              {entry.diff.modified.length > 0 && <span style={{ fontSize:'0.68em', padding:'1px 4px', borderRadius:2, background:'rgba(220,220,170,0.15)', color:'#dcdcaa' }}>~{entry.diff.modified.length}</span>}
              {entry.diff.deleted.length > 0 && <span style={{ fontSize:'0.68em', padding:'1px 4px', borderRadius:2, background:'rgba(244,135,113,0.15)', color:'#f48771' }}>−{entry.diff.deleted.length}</span>}
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <div style={{ padding:'10px', color:'var(--vscode-descriptionForeground)', fontSize:'0.82em' }}>No mutations yet.</div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draftCommand, setDraftCommand] = useState('');
  const [responses, setResponses] = useState<ResponseEntry[]>([]);
  const [showRef, setShowRef] = useState(false);
  const [commandRefData, setCommandRefData] = useState<CommandReference | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [keys, setKeys] = useState<RedisKey[]>([]);
  const [lastDiff, setLastDiff] = useState<any>(null);
  const [highlightedKeys, setHighlightedKeys] = useState<Record<string, any>>({});
  const [deletingKeys, setDeletingKeys] = useState<Record<string, any>>({});
  const [saveDiff, setSaveDiff] = useState<any>(null);
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [currentDb, setCurrentDb] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<Map<string, PendingCommand>>(new Map());
  const deletingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const vscodeApi = useRef<{ postMessage: (msg: any) => void } | null>(null);

  useEffect(() => {
    // @ts-ignore
    vscodeApi.current = acquireVsCodeApi();
    vscodeApi.current?.postMessage({ type: 'ready' });
  }, []);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [responses]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg?.type) return;
      switch (msg.type) {
        case 'config':
          setConnectionStatus('connected');
          break;
        case 'commandReference':
          setCommandRefData(msg.data);
          break;
        case 'connectionStatus':
          setConnectionStatus(msg.data?.status ?? msg.status ?? 'offline');
          break;
        case 'connectionError':
          setConnectionStatus('offline');
          break;
        case 'stateUpdate': {
          const data = msg.data ?? msg;
          const state = data.state ?? {};
          setKeys(state.keys ?? []);
          setLastDiff(data.diff);
          const currentNames = new Set((state.keys ?? []).map((k: any) => k.name));
          setDeletingKeys(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(k => { if (!currentNames.has(k)) delete next[k]; });
            return next;
          });
          break;
        }
        case 'commandResponse': {
          const pending = pendingRef.current.get(msg.id);
          if (!pending) break;
          clearTimeout(pending.timeoutHandle);
          pendingRef.current.delete(msg.id);
          setResponses(prev => [...prev, {
            id: msg.id, command: pending.command,
            result: msg.result, error: msg.error,
            status: msg.status, executionTimeMs: msg.executionTimeMs,
          }]);
          break;
        }
        case 'highlightKeys':
          setHighlightedKeys(Object.fromEntries((msg.data?.keys ?? []).map((k: any) => [k.name, k])));
          break;
        case 'saveDiff':
          if (!msg.data?.isStale && (msg.data?.diff?.added?.length || msg.data?.diff?.modified?.length || msg.data?.diff?.deleted?.length)) {
            setSaveDiff(msg.data);
          }
          break;
        case 'profiles':
          setProfiles(msg.data?.profiles ?? []);
          setActiveProfileId(msg.data?.activeId ?? null);
          break;
        case 'dbSelected':
          setCurrentDb(msg.data?.db ?? 0);
          break;
        case 'timelineEntry':
          setTimelineEntries(prev => {
            const next = msg.data.isOldestDiscarded ? prev.slice(1) : [...prev];
            return [...next, msg.data].slice(-20);
          });
          break;
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const submitCommand = useCallback(() => {
    const trimmed = command.trim();
    if (!trimmed) return;
    const id = crypto.randomUUID();
    const timeoutHandle = setTimeout(() => {
      if (pendingRef.current.has(id)) {
        const pending = pendingRef.current.get(id)!;
        pendingRef.current.delete(id);
        setResponses(prev => [...prev, { id, command: pending.command, status: 'timeout', error: `Timed out after ${COMMAND_TIMEOUT_MS}ms.`, executionTimeMs: COMMAND_TIMEOUT_MS }]);
      }
    }, COMMAND_TIMEOUT_MS);
    pendingRef.current.set(id, { id, command: trimmed, timeoutHandle });
    vscodeApi.current?.postMessage({ type: 'executeCommand', id, command: trimmed });
    setHistory(prev => [trimmed, ...prev.filter(h => h !== trimmed)].slice(0, COMMAND_HISTORY_SIZE));
    setCommand('');
    setHistoryIndex(-1);
    setDraftCommand('');
  }, [command]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submitCommand();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (history.length === 0) return;
      const idx = historyIndex === -1 ? 0 : historyIndex;
      setCommand(history[idx]);
      setHistoryIndex(idx);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      if (historyIndex === -1) setDraftCommand(command);
      const newIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);
      setCommand(history[newIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const newIndex = historyIndex - 1;
      if (newIndex === -1) { setHistoryIndex(-1); setCommand(draftCommand); }
      else { setHistoryIndex(newIndex); setCommand(history[newIndex]); }
    }
  };

  const handleDelete = (keyName: string) => {
    if (deletingKeys[keyName]) return;
    setDeletingKeys(prev => ({ ...prev, [keyName]: true }));
    const id = crypto.randomUUID();
    vscodeApi.current?.postMessage({ type: 'deleteKey', version: 1, timestamp: Date.now(), id, data: { keyName, id } });
    deletingTimers.current[keyName] = setTimeout(() => {
      setDeletingKeys(prev => { const next = { ...prev }; delete next[keyName]; return next; });
    }, 5000);
  };

  const switchConnection = (profileId: string) => {
    vscodeApi.current?.postMessage({ type: 'switchConnection', version: 1, timestamp: Date.now(), data: { profileId } });
  };

  const handleFilter = (pattern: string) => {
    vscodeApi.current?.postMessage({ type: 'setFilter', version: 1, timestamp: Date.now(), data: { pattern } });
  };

  const handleDbSelect = (db: number) => {
    setCurrentDb(db);
    vscodeApi.current?.postMessage({ type: 'selectDb', version: 1, timestamp: Date.now(), data: { db } });
  };
  const handleJump = (filename: string, line: number) => {
    vscodeApi.current?.postMessage({ type: 'jumpToCode', version: 1, timestamp: Date.now(), data: { filename, line } });
  };

  const insertFromRef = (signature: string) => {
    const firstSpace = signature.indexOf(' ');
    setCommand(firstSpace === -1 ? signature : signature.slice(0, firstSpace + 1));
    setShowRef(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Close ref/timeline mutually
  const toggleRef = () => {
    setShowRef(r => !r);
    setShowTimeline(false);
  };
  const toggleTimeline = () => {
    setShowTimeline(t => !t);
    setShowRef(false);
  };

  const tokens = tokenize(command);
  const highlightedHtml = command ? renderTokens(tokens) : '';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', fontFamily:'var(--vscode-editor-font-family, monospace)', fontSize:'var(--vscode-editor-font-size, 13px)', boxSizing:'border-box', overflow:'hidden', background:'var(--vscode-editor-background)' }}>

      {/* Terminal output — scrollable, takes remaining space */}
      <div ref={outputRef} style={{ flex:1, overflowY:'auto', padding:'8px 10px', display:'flex', flexDirection:'column', gap:5, minHeight:0 }}>
        {responses.length === 0 && connectionStatus === 'connected' && (
          <div style={{ color:'var(--vscode-descriptionForeground)', fontSize:'0.82em', padding:'4px 0' }}>
            Redis is ready. Try: SET mykey hello
          </div>
        )}
        {connectionStatus === 'offline' && responses.length === 0 && (
          <div style={{ color:'var(--vscode-errorForeground)', fontSize:'0.82em', padding:'4px 0' }}>
            Not connected — use <strong>Ctrl+Shift+P → Redis Live: Connect</strong>
          </div>
        )}
        {responses.map(entry => (
          <div key={entry.id} style={{ borderBottom:'1px solid var(--vscode-panel-border)', paddingBottom:5 }}>
            <div style={{ color:'var(--vscode-descriptionForeground)', fontSize:'0.82em' }}>
              <span style={{ userSelect:'none' }}>❯ </span>
              <span dangerouslySetInnerHTML={{ __html: renderTokens(tokenize(entry.command)) }} />
            </div>
            <div style={{ marginLeft:12, marginTop:2, fontSize:'0.82em' }}>
              {entry.status === 'error' || entry.status === 'timeout'
                ? <span style={{ color:'var(--vscode-errorForeground)' }}>ERR {entry.error}</span>
                : <ResponseValue value={entry.result} />}
            </div>
            <div style={{ fontSize:'0.7em', color:'var(--vscode-descriptionForeground)', marginTop:1, opacity:0.7 }}>{entry.executionTimeMs}ms</div>
          </div>
        ))}
      </div>

      {/* Input row */}
      <div
        style={{ borderTop:'1px solid var(--vscode-panel-border)', padding:'5px 10px', display:'flex', alignItems:'center', gap:4, flexShrink:0, background:'var(--vscode-editor-background)', cursor:'text' }}
        onClick={e => { if ((e.target as HTMLElement).tagName !== 'BUTTON') inputRef.current?.focus(); }}>
        <button onClick={toggleRef} title="Command reference (⌨)"
          style={{ background:'none', border:'none', color: showRef ? 'var(--vscode-textLink-foreground, #4fc1ff)' : 'var(--vscode-descriptionForeground)', cursor:'pointer', padding:'0 2px', fontSize:'0.9em', flexShrink:0 }}>⌨</button>
        <button onClick={toggleTimeline} title="Mutation timeline (⏱)"
          style={{ background:'none', border:'none', color: showTimeline ? 'var(--vscode-textLink-foreground, #4fc1ff)' : 'var(--vscode-descriptionForeground)', cursor:'pointer', padding:'0 2px', fontSize:'0.82em', flexShrink:0 }}>⏱</button>
        <span style={{ color:'var(--vscode-descriptionForeground)', userSelect:'none', flexShrink:0 }}>❯</span>
        <div style={{ position:'relative', flex:1, height:'1.4em' }}>
          <input
            ref={inputRef} type="text" value={command} autoFocus spellCheck={false}
            onChange={e => { setCommand(e.target.value); if (historyIndex !== -1) setHistoryIndex(-1); }}
            onKeyDown={handleKeyDown}
            style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', background:'transparent', border:'none', outline:'none', color:'transparent', caretColor:'var(--vscode-editorCursor-foreground)', fontFamily:'inherit', fontSize:'inherit', zIndex:2, padding:0, margin:0 }}
          />
          <div
            style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', whiteSpace:'pre', fontFamily:'inherit', fontSize:'inherit', lineHeight:'1.4em', zIndex:1 }}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </div>
      </div>

      {/* Bottom panels — only one shows at a time */}
      {showRef && (
        <CommandRef data={commandRefData} onInsert={insertFromRef} onClose={() => setShowRef(false)} />
      )}
      {showTimeline && !showRef && (
        <TimelinePanel entries={timelineEntries} onClose={() => setShowTimeline(false)} />
      )}
      {!showRef && !showTimeline && (
        <StatePanel
          keys={keys}
          connectionStatus={connectionStatus}
          diff={lastDiff}
          highlightedKeys={highlightedKeys}
          deletingKeys={deletingKeys}
          onDelete={handleDelete}
          onJump={handleJump}
          saveDiff={saveDiff}
          onDismissSaveDiff={() => setSaveDiff(null)}
          profiles={profiles}
          activeProfileId={activeProfileId}
          onSwitchProfile={switchConnection}
          onFilter={handleFilter}
          currentDb={currentDb}
          onDbSelect={handleDbSelect}
        />
      )}
    </div>
  );
};

export default App;
