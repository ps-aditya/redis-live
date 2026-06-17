// frontend/src/pages/TerminalPage.tsx

import { CommandConsole } from '../components/CommandConsole';
import type { UseRedisStateReturn } from '../hooks/useRedisState';

const COMMAND_REFERENCE = [
  { group: 'Strings',  commands: [
    { cmd: 'SET key value',    desc: 'Set a string value' },
    { cmd: 'GET key',          desc: 'Retrieve a string value' },
    { cmd: 'DEL key',          desc: 'Delete a key' },
    { cmd: 'EXISTS key',       desc: 'Check if a key exists' },
    { cmd: 'EXPIRE key sec',   desc: 'Set a TTL in seconds' },
  ]},
  { group: 'Lists', commands: [
    { cmd: 'LPUSH key value',  desc: 'Push to the head of a list' },
    { cmd: 'RPOP key',         desc: 'Pop from the tail' },
    { cmd: 'LPOP key',         desc: 'Pop from the head' },
    { cmd: 'LLEN key',         desc: 'Get list length' },
  ]},
  { group: 'Hashes', commands: [
    { cmd: 'HSET key field value', desc: 'Set a hash field' },
    { cmd: 'HGET key field',       desc: 'Get a hash field' },
  ]},
  { group: 'Sets', commands: [
    { cmd: 'SADD key value',   desc: 'Add a member to a set' },
    { cmd: 'SREM key value',   desc: 'Remove a member' },
  ]},
  { group: 'Database', commands: [
    { cmd: 'FLUSHALL',         desc: 'Clear the entire keyspace' },
  ]},
];

interface TerminalPageProps {
  redisState: UseRedisStateReturn;
}

export function TerminalPage({ redisState }: TerminalPageProps) {
  const { history, handleExecute, isExecuting } = redisState;

  return (
    <div className="terminal-page">
      <div className="terminal-page-header">
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#DC143C' }}>terminal</span>
        <span className="terminal-page-title">Terminal</span>
        <span className="terminal-page-sub">Full-screen console — no card clutter</span>
      </div>

      <div className="terminal-page-split">
        <div className="terminal-page-console">
          <CommandConsole
            onExecute={handleExecute}
            history={history}
            isLoading={isExecuting}
          />
        </div>

        <aside className="terminal-page-reference">
          <div className="terminal-reference-header">Command Reference</div>
          {COMMAND_REFERENCE.map((group) => (
            <div key={group.group} className="terminal-reference-group">
              <div className="terminal-reference-group-label">{group.group}</div>
              {group.commands.map((c) => (
                <div key={c.cmd} className="terminal-reference-row">
                  <code className="terminal-reference-cmd">{c.cmd}</code>
                  <span className="terminal-reference-desc">{c.desc}</span>
                </div>
              ))}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}