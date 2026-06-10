// frontend/src/pages/ExperimentPage.tsx

import { useState, useRef, useEffect } from 'react';
import type { UseRedisStateReturn } from '../hooks/useRedisState';

const EXPERIMENT_DATA = {
  tag: 'Break & Learn',
  title: 'Queue Manipulation',
  module: '02',
  total: '06',
  description:
    'Understand how Lists function as queues by simulating an asynchronous worker process. Add payload data and observe the structural shifts in real-time.',
  usefulCommands: [
    { kw: 'LPUSH', args: 'key val' },
    { kw: 'RPUSH', args: 'key val' },
    { kw: 'RPOP',  args: 'key'     },
    { kw: 'LLEN',  args: 'key'     },
  ],
  howToBreak:
    'Try using LSET to overwrite data mid-queue or RPOP repeatedly until the list is empty to observe underflow behavior.',
  steps: [
    {
      id: 1,
      label: 'Initialize the list `task_queue` with 3 initial payloads.',
      hint: '> LPUSH task_queue job_1 job_2 job_3',
      check: (cmd: string) => cmd.toUpperCase().startsWith('LPUSH') && cmd.includes('task_queue'),
    },
    {
      id: 2,
      label: 'Pop the oldest task off the queue for processing.',
      hint: 'Waiting for RPOP command...',
      check: (cmd: string) => cmd.toUpperCase().startsWith('RPOP') && cmd.includes('task_queue'),
    },
    {
      id: 3,
      label: 'Verify queue length is exactly 2.',
      hint: 'Waiting for LLEN task_queue...',
      check: (cmd: string) => cmd.toUpperCase().startsWith('LLEN') && cmd.includes('task_queue'),
    },
  ],
  production: {
    label: 'WHERE THIS IS USED IN PRODUCTION',
    tags: ['E-Commerce', 'Food Delivery', 'Job Schedulers'],
    who: 'A food delivery platform',
    why: 'Customer orders must be dispatched in the exact sequence they arrive.',
  },
};

interface ExperimentPageProps {
  onNavigate: (page: string) => void;
  redisState: UseRedisStateReturn;
}

export function ExperimentPage({ onNavigate, redisState }: ExperimentPageProps) {
  const { handleExecute } = redisState;

  const [activeTab, setActiveTab]       = useState<'useful' | 'break'>('useful');
  const [completedSteps, setCompleted]  = useState<number[]>([]);
  const [terminalLog, setTerminalLog]   = useState([
    { type: 'comment', text: '# RSE Runtime Environment initialized.' },
    { type: 'comment', text: '# Connected to: redis://127.0.0.1:6379' },
  ]);
  const [queueNodes, setQueueNodes]     = useState<{ id: number; value: string; index: number }[]>([]);
  const [inputVal, setInputVal]         = useState('');

  const logEndRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLog]);

  const currentStep = EXPERIMENT_DATA.steps.find((s) => !completedSteps.includes(s.id));
  const progress    = completedSteps.length / EXPERIMENT_DATA.steps.length;

  async function runCommand(raw: string) {
    if (!raw.trim()) return;

    setTerminalLog((prev) => [...prev, { type: 'cmd', text: raw }]);
    await handleExecute(raw);

    const step = EXPERIMENT_DATA.steps.find(
      (s) => !completedSteps.includes(s.id) && s.check(raw)
    );
    if (step) setTimeout(() => setCompleted((p) => [...p, step.id]), 300);

    const upper = raw.trim().toUpperCase();
    if (upper.startsWith('LPUSH') && raw.includes('task_queue')) {
      const parts  = raw.trim().split(/\s+/);
      const values = parts.slice(2);
      setQueueNodes((prev) => {
        const next = [...values.map((v, i) => ({ id: Date.now() + i, value: v, index: i })).reverse(), ...prev];
        return next.map((n, i) => ({ ...n, index: i }));
      });
      setTerminalLog((p) => [...p, { type: 'resp', text: `(integer) ${values.length}` }]);
    } else if (upper.startsWith('RPOP') && raw.includes('task_queue')) {
      setQueueNodes((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        setTerminalLog((pl) => [...pl, { type: 'resp', text: `"${last.value}"` }]);
        return prev.slice(0, -1).map((n, i) => ({ ...n, index: i }));
      });
    } else if (upper.startsWith('LLEN')) {
      setTerminalLog((p) => [...p, { type: 'resp', text: `(integer) ${queueNodes.length}` }]);
    } else {
      setTerminalLog((p) => [...p, { type: 'resp', text: 'OK' }]);
    }

    setInputVal('');
  }

  return (
    <div className="experiment-page">

      {/* ── Module progress bar ── */}
      <div className="exp-module-bar">
        <button className="exp-module-back" onClick={() => onNavigate('lab')}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="exp-module-title">Simulating Queues with Lists</div>
        <span className="exp-module-count">
          Module {EXPERIMENT_DATA.module} of {EXPERIMENT_DATA.total}
        </span>
        <div className="exp-module-progress-track">
          <div
            className="exp-module-progress-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* ── Split workspace ── */}
      <div className="exp-split">

        {/* ── Left: Briefing (30%) ── */}
        <aside className="exp-briefing">
          <header className="exp-briefing-header">
            <div className="exp-briefing-tag">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>experiment</span>
              {EXPERIMENT_DATA.tag}
            </div>
            <h2 className="exp-briefing-title">{EXPERIMENT_DATA.title}</h2>
            <p className="exp-briefing-desc">{EXPERIMENT_DATA.description}</p>
          </header>

          <div className="exp-briefing-body">

            {/* Commands tabs */}
            <section className="exp-section">
              <div className="exp-tabs">
                <button
                  className={`exp-tab ${activeTab === 'useful' ? 'exp-tab--active' : ''}`}
                  onClick={() => setActiveTab('useful')}
                >
                  Useful Commands
                </button>
                <button
                  className={`exp-tab ${activeTab === 'break' ? 'exp-tab--active' : ''}`}
                  onClick={() => setActiveTab('break')}
                >
                  How to break it
                </button>
              </div>
              {activeTab === 'useful' && (
                <div className="exp-commands-list">
                  {EXPERIMENT_DATA.usefulCommands.map((c) => (
                    <code key={c.kw} className="exp-command-pill">
                      <span className="exp-cmd-kw">{c.kw}</span>{' '}
                      <span className="exp-cmd-arg">{c.args}</span>
                    </code>
                  ))}
                </div>
              )}
              {activeTab === 'break' && (
                <p className="exp-break-text">{EXPERIMENT_DATA.howToBreak}</p>
              )}
            </section>

            {/* Checklist */}
            <section className="exp-section">
              <div className="exp-checklist-header">
                <span className="exp-checklist-title">Verification Steps</span>
                <span className="exp-checklist-count">
                  {completedSteps.length} / {EXPERIMENT_DATA.steps.length}
                </span>
              </div>
              <div className="exp-checklist">
                {EXPERIMENT_DATA.steps.map((step) => {
                  const isDone   = completedSteps.includes(step.id);
                  const isActive = !isDone && step.id === currentStep?.id;
                  const isLocked = !isDone && !isActive;
                  return (
                    <div
                      key={step.id}
                      className={`exp-check-item ${isDone ? 'exp-check-item--done' : ''} ${isActive ? 'exp-check-item--active' : ''}`}
                    >
                      <span className="material-symbols-outlined exp-check-icon" style={{ fontVariationSettings: isDone ? "'FILL' 1" : "'FILL' 0" }}>
                        {isDone ? 'check_box' : isLocked ? 'lock' : 'check_box_outline_blank'}
                      </span>
                      <div className="exp-check-content">
                        <p className={`exp-check-label ${isDone ? 'exp-check-label--done' : ''}`}>
                          {step.label}
                        </p>
                        {isActive && <p className="exp-check-hint">{step.hint}</p>}
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
                <span className="exp-production-label">{EXPERIMENT_DATA.production.label}</span>
              </div>
              <div className="exp-production-tags">
                {EXPERIMENT_DATA.production.tags.map((t) => (
                  <span key={t} className="exp-production-tag">{t}</span>
                ))}
              </div>
              <div className="exp-production-fields">
                <div><span className="exp-production-field-label">WHO:</span> {EXPERIMENT_DATA.production.who}</div>
                <div><span className="exp-production-field-label">WHY:</span> {EXPERIMENT_DATA.production.why}</div>
              </div>
            </section>

          </div>

          <footer className="exp-briefing-footer">
            <button className="exp-footer-reset">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
              Reset Env
            </button>
            <button className="exp-footer-skip" onClick={() => onNavigate('lab')}>
              Skip Module
            </button>
          </footer>
        </aside>

        {/* ── Right: Terminal + Visualizer (70%) ── */}
        <div className="exp-work-area">

          {/* Terminal header */}
          <div className="exp-terminal-bar">
            <div className="exp-terminal-dots">
              <span className="exp-dot exp-dot--red" />
              <span className="exp-dot exp-dot--yellow" />
              <span className="exp-dot exp-dot--green" />
            </div>
            <span className="exp-terminal-title">rse-node-01 / task_runner</span>
          </div>

          {/* Terminal output */}
          <div className="exp-terminal" onClick={() => inputRef.current?.focus()}>
            <div className="exp-terminal-log">
              {terminalLog.map((line, i) => (
                <div key={i}>
                  {line.type === 'comment' && <div className="exp-log-comment">{line.text}</div>}
                  {line.type === 'cmd'     && <div className="exp-log-cmd"><span className="exp-log-prompt">rse:6379&gt; </span>{line.text}</div>}
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
              />
              <span className="exp-cursor" />
            </div>
          </div>

          {/* Live structure visualizer */}
          <div className="exp-live-viz">
            <div className="exp-live-viz-header">
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#555' }}>data_object</span>
              <span className="exp-live-viz-label">
                Live Structure: <span className="exp-live-viz-key">task_queue</span>
              </span>
              <span className="exp-live-viz-badge">LIST</span>
              <div className="exp-live-viz-meta">
                <span>● HEAD</span>
                <span>○ TAIL</span>
                <span>LEN: {queueNodes.length}</span>
              </div>
            </div>
            <div className="exp-live-viz-canvas">
              {queueNodes.length === 0 ? (
                <span className="exp-live-viz-empty">
                  Queue is empty — try LPUSH task_queue job_1
                </span>
              ) : (
                <div className="exp-live-nodes">
                  {queueNodes.map((node, i) => (
                    <>
                      <div key={node.id} className={`exp-live-node ${i === 0 ? 'exp-live-node--head' : ''}`}>
                        <div className="exp-live-node-index">Index: {node.index}</div>
                        <div className="exp-live-node-value">"{node.value}"</div>
                      </div>
                      {i < queueNodes.length - 1 && <div className="exp-live-connector" />}
                    </>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}