// frontend/src/pages/ExperimentPage.tsx

import { useState, useRef, useEffect } from 'react';
import type { UseRedisStateReturn } from '../hooks/useRedisState';
import type { Experiment, RedisEntry } from '../types';
import { EXPERIMENTS } from '../data/experiments';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Maps Redis command keywords to their canonical argument signature,
 * used for the "Useful Commands" cheatsheet in the briefing panel.
 */
const KEYWORD_ARGS: Record<string, string> = {
  SET: 'key value', GET: 'key', DEL: 'key', EXISTS: 'key',
  EXPIRE: 'key seconds', LPUSH: 'key value', RPOP: 'key',
  LPOP: 'key', RPUSH: 'key value', LLEN: 'key',
  SADD: 'key member', SREM: 'key member', SMEMBERS: 'key',
  HSET: 'key field value', HGET: 'key field', HDEL: 'key field',
};

/** Derive unique {kw, args} pairs from the experiment's command list. */
function deriveUsefulCommands(commands: string[]): { kw: string; args: string }[] {
  const seen = new Set<string>();
  const result: { kw: string; args: string }[] = [];
  for (const cmd of commands) {
    const kw = cmd.trim().split(/\s+/)[0]?.toUpperCase() ?? '';
    if (kw && !seen.has(kw)) {
      seen.add(kw);
      result.push({ kw, args: KEYWORD_ARGS[kw] ?? 'key [value]' });
    }
  }
  return result;
}

/**
 * Step matching: given a template command and user input, return true if
 * the user ran the same Redis operation on the same key (case-insensitive,
 * first 2 tokens must match).
 */
function matchesStep(template: string, input: string): boolean {
  const tParts = template.trim().toLowerCase().split(/\s+/);
  const uParts = input.trim().toLowerCase().split(/\s+/);
  if (tParts.length === 0 || uParts.length === 0) return false;
  // Must match operation (token 0) and key (token 1, if present)
  if (tParts[0] !== uParts[0]) return false;
  if (tParts.length >= 2 && uParts.length >= 2) {
    return tParts[1] === uParts[1];
  }
  return true;
}

/**
 * Extract key names referenced in an experiment's commands.
 * Used to scope the live visualizer to experiment-relevant keys.
 */
function extractExperimentKeys(commands: string[]): Set<string> {
  const keys = new Set<string>();
  for (const cmd of commands) {
    const parts = cmd.trim().split(/\s+/);
    if (parts.length >= 2) keys.add(parts[1].toLowerCase());
  }
  return keys;
}

/**
 * Per-experiment production context. Experiments without a specific entry
 * get a generic note. This data lives here (not in experiments.ts) because
 * the Experiment type intentionally stays lean — production context is UI
 * enrichment, not core experiment data.
 */
const PRODUCTION_CONTEXT: Record<string, {
  label: string;
  tags: string[];
  who: string;
  why: string;
}> = {
  'list-as-queue': {
    label: 'WHERE THIS IS USED IN PRODUCTION',
    tags: ['E-Commerce', 'Food Delivery', 'Job Schedulers'],
    who: 'A food delivery platform',
    why: 'Customer orders must be dispatched in the exact sequence they arrive.',
  },
  'list-as-stack': {
    label: 'WHERE THIS IS USED IN PRODUCTION',
    tags: ['Browsers', 'Undo Systems', 'Navigation'],
    who: 'Any application with undo/redo or navigation history',
    why: 'The most recently visited state must always be the first one returned.',
  },
  'ttl-watch-expiry': {
    label: 'WHERE THIS IS USED IN PRODUCTION',
    tags: ['Auth', 'Sessions', 'Rate Limiting'],
    who: 'Any authentication system',
    why: 'Session tokens must expire automatically — no manual cleanup required.',
  },
  'caching-pattern': {
    label: 'WHERE THIS IS USED IN PRODUCTION',
    tags: ['APIs', 'Databases', 'CDNs'],
    who: 'High-traffic API services',
    why: 'Expensive database queries are cached so repeated requests cost nothing.',
  },
  'set-uniqueness': {
    label: 'WHERE THIS IS USED IN PRODUCTION',
    tags: ['Analytics', 'Streaming', 'Ad Tech'],
    who: 'Video streaming platforms',
    why: 'Unique viewer counts per video require deduplication at scale.',
  },
  'hash-as-object': {
    label: 'WHERE THIS IS USED IN PRODUCTION',
    tags: ['User Profiles', 'Inventory', 'Config'],
    who: 'E-commerce platforms',
    why: 'Product metadata needs partial updates without rewriting the full object.',
  },
  'wrongtype-error': {
    label: 'WHY THIS MATTERS IN PRODUCTION',
    tags: ['Safety', 'Multi-Service', 'Debugging'],
    who: 'Any system with multiple services writing to Redis',
    why: 'Type enforcement prevents one service from silently corrupting another service\'s data.',
  },
};

const GENERIC_PRODUCTION = {
  label: 'WHY THIS MATTERS IN PRODUCTION',
  tags: ['Redis', 'Backend', 'Engineering'],
  who: 'Backend engineers working with Redis',
  why: 'Understanding this behavior prevents subtle bugs in production systems.',
};

// ── Mini structure renderers for the live viz panel ──────────────────────────

function MiniStringBlock({ keyName, entry }: { keyName: string; entry: Extract<RedisEntry, { type: 'string' }> }) {
  return (
    <div className="exp-viz-block">
      <div className="exp-viz-block-header">
        <span className="exp-viz-badge exp-viz-badge--string">STRING</span>
        <span className="exp-viz-key">{keyName}</span>
        {entry.ttl > 0 && <span className="exp-viz-ttl">{entry.ttl}s</span>}
      </div>
      <div className="exp-viz-string-value">"{entry.value}"</div>
    </div>
  );
}

function MiniListBlock({ keyName, entry }: { keyName: string; entry: Extract<RedisEntry, { type: 'list' }> }) {
  return (
    <div className="exp-viz-block">
      <div className="exp-viz-block-header">
        <span className="exp-viz-badge exp-viz-badge--list">LIST</span>
        <span className="exp-viz-key">{keyName}</span>
        <span className="exp-viz-meta">LEN: {entry.value.length}</span>
      </div>
      <div className="exp-live-nodes">
        {entry.value.length === 0 ? (
          <span className="exp-live-viz-empty">(empty)</span>
        ) : (
          entry.value.map((item, i) => (
            <div key={`${keyName}-${i}`} className="exp-live-nodes-row">
              <div className={`exp-live-node ${i === 0 ? 'exp-live-node--head' : ''}`}>
                <div className="exp-live-node-index">Index: {i}</div>
                <div className="exp-live-node-value">"{item}"</div>
              </div>
              {i < entry.value.length - 1 && <div className="exp-live-connector" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MiniHashBlock({ keyName, entry }: { keyName: string; entry: Extract<RedisEntry, { type: 'hash' }> }) {
  const fields = Object.entries(entry.value);
  return (
    <div className="exp-viz-block">
      <div className="exp-viz-block-header">
        <span className="exp-viz-badge exp-viz-badge--hash">HASH</span>
        <span className="exp-viz-key">{keyName}</span>
        <span className="exp-viz-meta">{fields.length} fields</span>
      </div>
      <div className="exp-viz-hash">
        {fields.map(([k, v]) => (
          <div key={k} className="exp-viz-hash-row">
            <span className="exp-viz-hash-field">{k}</span>
            <span className="exp-viz-hash-val">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniSetBlock({ keyName, entry }: { keyName: string; entry: Extract<RedisEntry, { type: 'set' }> }) {
  return (
    <div className="exp-viz-block">
      <div className="exp-viz-block-header">
        <span className="exp-viz-badge exp-viz-badge--set">SET</span>
        <span className="exp-viz-key">{keyName}</span>
        <span className="exp-viz-meta">{entry.value.length} unique</span>
      </div>
      <div className="exp-viz-set-pills">
        {entry.value.map((m) => <span key={m} className="exp-viz-pill">{m}</span>)}
      </div>
    </div>
  );
}

// ── Experiment Library (selection screen) ─────────────────────────────────────

const DIFFICULTY_ORDER = { Beginner: 0, Intermediate: 1, Advanced: 2 };

interface ExperimentLibraryProps {
  onSelect: (exp: Experiment) => void;
  onNavigate: (page: string) => void;
}

function ExperimentLibrary({ onSelect, onNavigate }: ExperimentLibraryProps) {
  const [filter, setFilter] = useState<string>('All');
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const sorted = [...EXPERIMENTS].sort(
    (a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
  );
  const filtered = filter === 'All' ? sorted : sorted.filter(e => e.difficulty === filter);

  return (
    <div className="exp-library-page">
      {/* Header */}
      <div className="exp-library-page-header">
        <div className="exp-library-page-header-left">
          <button className="exp-module-back" onClick={() => onNavigate('lab')}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="exp-library-page-title">Experiment Library</h2>
            <p className="exp-library-page-sub">
              Each experiment is a guided question. Run steps one at a time. Watch what changes.
            </p>
          </div>
        </div>
        <div className="exp-library-filters">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={`exp-library-filter-btn ${filter === d ? 'exp-library-filter-btn--active' : ''}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="exp-library-grid-page">
        {filtered.map((exp, i) => (
          <div key={exp.id} className="exp-library-card">
            <div className="exp-library-card-top">
              <span className={`exp-library-card-num`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={`exp-difficulty exp-difficulty--${exp.difficulty.toLowerCase()}`}>
                {exp.difficulty}
              </span>
              <div className="exp-concepts">
                {exp.concepts.map((c) => (
                  <span key={c} className="exp-concept-tag">{c}</span>
                ))}
              </div>
            </div>

            <h3 className="exp-library-card-question">{exp.question}</h3>

            <div className="exp-library-card-hyp">
              <span className="exp-hyp-label">Hypothesis</span>
              {exp.hypothesis}
            </div>

            <p className="exp-library-card-desc">{exp.description}</p>

            <div className="exp-library-card-commands">
              {exp.commands.map((cmd, ci) => (
                <span key={ci} className="exp-cmd-pill">{cmd}</span>
              ))}
            </div>

            <button className="exp-start-btn" onClick={() => onSelect(exp)}>
              Start Experiment →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Experiment Runner ─────────────────────────────────────────────────────────

interface ExperimentRunnerProps {
  exp: Experiment;
  index: number;
  total: number;
  onBack: () => void;
  redisState: UseRedisStateReturn;
}

function ExperimentRunner({ exp, index, total, onBack, redisState }: ExperimentRunnerProps) {
  const { handleExecute, currentState } = redisState;

  const [activeTab, setActiveTab]      = useState<'useful' | 'break'>('useful');
  const [completedSteps, setCompleted] = useState<number[]>([]);
  const [terminalLog, setTerminalLog]  = useState([
    { type: 'comment', text: '# RSE Runtime Environment initialized.' },
    { type: 'comment', text: `# Experiment: ${exp.title}` },
    { type: 'comment', text: `# Run the commands below one at a time.` },
  ]);
  const [inputVal, setInputVal]        = useState('');
  const [showReflection, setShowReflection] = useState(false);

  const logEndRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLog]);

  // When all steps complete, show reflection after a short delay
  useEffect(() => {
    if (completedSteps.length === exp.commands.length && exp.commands.length > 0) {
      const t = setTimeout(() => setShowReflection(true), 600);
      return () => clearTimeout(t);
    }
  }, [completedSteps.length, exp.commands.length]);

  const progress        = completedSteps.length / exp.commands.length;
  const currentStepIdx  = completedSteps.length; // next step to complete = this index
  const usefulCommands  = deriveUsefulCommands(exp.commands);
  const productionCtx   = PRODUCTION_CONTEXT[exp.id] ?? GENERIC_PRODUCTION;
  const expKeys         = extractExperimentKeys(exp.commands);

  // Live viz: keys from currentState that this experiment touches
  const liveEntries = Object.entries(currentState).filter(
    ([k]) => expKeys.has(k.toLowerCase())
  );

  async function runCommand(raw: string) {
    if (!raw.trim()) return;
    setTerminalLog((prev) => [...prev, { type: 'cmd', text: raw }]);
    await handleExecute(raw);

    // Check against the CURRENT expected step (steps are sequential)
    if (currentStepIdx < exp.commands.length) {
      const template = exp.commands[currentStepIdx];
      if (matchesStep(template, raw)) {
        const stepId = currentStepIdx;
        setTimeout(() => setCompleted((p) => [...p, stepId]), 300);
        setTerminalLog((prev) => [...prev,
          { type: 'resp', text: `✓ Step ${currentStepIdx + 1} complete` }
        ]);
      } else {
        setTerminalLog((prev) => [...prev, { type: 'resp', text: 'OK' }]);
      }
    } else {
      setTerminalLog((prev) => [...prev, { type: 'resp', text: 'OK' }]);
    }

    setInputVal('');
  }

  function handleReset() {
    setCompleted([]);
    setShowReflection(false);
    setInputVal('');
    setTerminalLog([
      { type: 'comment', text: '# RSE Runtime Environment initialized.' },
      { type: 'comment', text: `# Experiment: ${exp.title}` },
      { type: 'comment', text: `# Run the commands below one at a time.` },
    ]);
  }

  return (
    <div className="experiment-page">

      {/* ── Module progress bar ── */}
      <div className="exp-module-bar">
        <button className="exp-module-back" onClick={onBack}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="exp-module-title">{exp.title}</div>
        <span className="exp-module-count">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <div className="exp-module-progress-track">
          <div className="exp-module-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {/* ── Reflection strip (shown on completion) ── */}
      {showReflection && (
        <div className="exp-reflection-strip">
          <span className="exp-reflection-label">
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#00ff88' }}>check_circle</span>
            Complete
          </span>
          <div className="exp-reflection-questions">
            {exp.reflection.map((q, i) => (
              <span key={i} className="exp-reflection-q">❓ {q}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Split workspace ── */}
      <div className="exp-split">

        {/* ── Left briefing (30%) ── */}
        <aside className="exp-briefing">
          <header className="exp-briefing-header">
            <div className="exp-briefing-tag">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>experiment</span>
              {exp.difficulty}
            </div>
            <h2 className="exp-briefing-title">{exp.question}</h2>
            <div className="exp-briefing-hypothesis">
              <span className="exp-hyp-label">Hypothesis</span>
              {exp.hypothesis}
            </div>
            <p className="exp-briefing-desc">{exp.description}</p>
          </header>

          <div className="exp-briefing-body">

            {/* Tabs: useful commands / how to break */}
            <section className="exp-section">
              <div className="exp-tabs">
                <button className={`exp-tab ${activeTab === 'useful' ? 'exp-tab--active' : ''}`} onClick={() => setActiveTab('useful')}>
                  Useful Commands
                </button>
                <button className={`exp-tab ${activeTab === 'break' ? 'exp-tab--active' : ''}`} onClick={() => setActiveTab('break')}>
                  How to break it
                </button>
              </div>
              {activeTab === 'useful' && (
                <div className="exp-commands-list">
                  {usefulCommands.map((c) => (
                    <code key={c.kw} className="exp-command-pill">
                      <span className="exp-cmd-kw">{c.kw}</span>{' '}
                      <span className="exp-cmd-arg">{c.args}</span>
                    </code>
                  ))}
                </div>
              )}
              {activeTab === 'break' && (
                <p className="exp-break-text">
                  Try running commands in the wrong order, use an incorrect key name, or apply
                  a List command to a String key to see how Redis enforces type safety.
                  Watch the error messages in the Visualizer's WRONGTYPE banner.
                </p>
              )}
            </section>

            {/* Step-by-step checklist */}
            <section className="exp-section">
              <div className="exp-checklist-header">
                <span className="exp-checklist-title">Verification Steps</span>
                <span className="exp-checklist-count">
                  {completedSteps.length} / {exp.commands.length}
                </span>
              </div>
              <div className="exp-checklist">
                {exp.commands.map((cmd, i) => {
                  const isDone   = completedSteps.includes(i);
                  const isActive = !isDone && i === currentStepIdx;
                  const isLocked = !isDone && !isActive;
                  return (
                    <div
                      key={i}
                      className={`exp-check-item ${isDone ? 'exp-check-item--done' : ''} ${isActive ? 'exp-check-item--active' : ''}`}
                    >
                      <span
                        className="material-symbols-outlined exp-check-icon"
                        style={{ fontVariationSettings: isDone ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {isDone ? 'check_box' : isLocked ? 'lock' : 'check_box_outline_blank'}
                      </span>
                      <div className="exp-check-content">
                        <p className={`exp-check-label ${isDone ? 'exp-check-label--done' : ''}`}>
                          Step {i + 1}
                        </p>
                        <code className={`exp-check-cmd ${isLocked ? 'exp-check-cmd--locked' : ''}`}>
                          {cmd}
                        </code>
                        {isActive && (
                          <p className="exp-check-hint">
                            → Run this command in the terminal
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Production context */}
            <section className="exp-production">
              <div className="exp-production-header">
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#DC143C' }}>bolt</span>
                <span className="exp-production-label">{productionCtx.label}</span>
              </div>
              <div className="exp-production-tags">
                {productionCtx.tags.map((t) => (
                  <span key={t} className="exp-production-tag">{t}</span>
                ))}
              </div>
              <div className="exp-production-fields">
                <div><span className="exp-production-field-label">WHO:</span> {productionCtx.who}</div>
                <div><span className="exp-production-field-label">WHY:</span> {productionCtx.why}</div>
              </div>
            </section>

          </div>

          <footer className="exp-briefing-footer">
            <button className="exp-footer-reset" onClick={handleReset}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
              Reset
            </button>
            <button className="exp-footer-skip" onClick={onBack}>
              Back to Library
            </button>
          </footer>
        </aside>

        {/* ── Right: Terminal + Live Viz (70%) ── */}
        <div className="exp-work-area">

          {/* Terminal title bar */}
          <div className="exp-terminal-bar">
            <div className="exp-terminal-dots">
              <span className="exp-dot exp-dot--red" />
              <span className="exp-dot exp-dot--yellow" />
              <span className="exp-dot exp-dot--green" />
            </div>
            <span className="exp-terminal-title">rse-node-01 / experiment-runner</span>
          </div>

          {/* Terminal */}
          <div className="exp-terminal" onClick={() => inputRef.current?.focus()}>
            <div className="exp-terminal-log">
              {terminalLog.map((line, i) => (
                <div key={i}>
                  {line.type === 'comment' && <div className="exp-log-comment">{line.text}</div>}
                  {line.type === 'cmd'     && (
                    <div className="exp-log-cmd">
                      <span className="exp-log-prompt">rse:6379&gt; </span>
                      {line.text}
                    </div>
                  )}
                  {line.type === 'resp'    && <div className="exp-log-resp">{line.text}</div>}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
            <div className="exp-terminal-input-row">
              <span className="exp-log-prompt">rse:6379&gt;</span>
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runCommand(inputVal)}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                className="exp-terminal-input"
                placeholder={currentStepIdx < exp.commands.length ? exp.commands[currentStepIdx] : 'All steps complete'}
              />
              <span className="exp-cursor" />
            </div>
          </div>

          {/* Live structure visualizer — keys touched by this experiment */}
          <div className="exp-live-viz">
            <div className="exp-live-viz-header">
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#555' }}>data_object</span>
              <span className="exp-live-viz-label">
                Live State
                {liveEntries.length > 0 && (
                  <span style={{ color: '#555', marginLeft: '6px' }}>
                    ({liveEntries.length} key{liveEntries.length !== 1 ? 's' : ''})
                  </span>
                )}
              </span>
              <div className="exp-live-viz-meta">
                {[...expKeys].slice(0, 3).map((k) => (
                  <span key={k} className="exp-viz-key-pill">{k}</span>
                ))}
              </div>
            </div>
            <div className="exp-live-viz-canvas">
              {liveEntries.length === 0 ? (
                <span className="exp-live-viz-empty">
                  {currentStepIdx < exp.commands.length
                    ? `Run: ${exp.commands[currentStepIdx]}`
                    : 'No experiment keys in state'}
                </span>
              ) : (
                <div className="exp-live-multi-blocks">
                  {liveEntries.map(([key, entry]) => {
                    if (entry.type === 'string') return <MiniStringBlock key={key} keyName={key} entry={entry} />;
                    if (entry.type === 'list')   return <MiniListBlock   key={key} keyName={key} entry={entry} />;
                    if (entry.type === 'hash')   return <MiniHashBlock   key={key} keyName={key} entry={entry} />;
                    if (entry.type === 'set')    return <MiniSetBlock    key={key} keyName={key} entry={entry} />;
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── ExperimentPage root ───────────────────────────────────────────────────────

interface ExperimentPageProps {
  onNavigate: (page: string) => void;
  redisState: UseRedisStateReturn;
}

export function ExperimentPage({ onNavigate, redisState }: ExperimentPageProps) {
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);

  if (!selectedExp) {
    return (
      <ExperimentLibrary
        onSelect={setSelectedExp}
        onNavigate={onNavigate}
      />
    );
  }

  const index = EXPERIMENTS.findIndex((e) => e.id === selectedExp.id);

  return (
    <ExperimentRunner
      exp={selectedExp}
      index={index}
      total={EXPERIMENTS.length}
      onBack={() => setSelectedExp(null)}
      redisState={redisState}
    />
  );
}