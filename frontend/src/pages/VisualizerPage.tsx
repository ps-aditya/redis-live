// frontend/src/pages/VisualizerPage.tsx

import { useState, useEffect, useRef } from 'react';
import type { UseRedisStateReturn } from '../hooks/useRedisState';
import type { RedisEntry } from '../types';

const TRACE_STEPS = ['INPUT', 'INTERPRET', 'DELTA', 'VISUALIZE'];

// ── Block renderers ──────────────────────────────────────────────────────────

function StringBlock({ keyName, entry, pulse }: { keyName: string; entry: Extract<RedisEntry, { type: 'string' }>; pulse?: 'new' | 'changed' }) {
  return (
    <div className={`viz-block ${pulse ? `viz-block-pulse--${pulse}` : ''}`}>
      <div className="viz-block-header">
        <span className="viz-type-badge viz-type-badge--string">STRING</span>
        <span className="viz-key-name">{keyName}</span>
      </div>
      <div className="viz-string-value">{entry.value || '(empty)'}</div>
      {entry.ttl > 0 && <div className="viz-ttl-bar"><div className="viz-ttl-fill" style={{ width: `${Math.min(100, (entry.ttl / 300) * 100)}%`, background: entry.ttl <= 10 ? '#FF3B3B' : entry.ttl <= 60 ? '#FFB800' : '#4DA6FF' }} /></div>}
    </div>
  );
}

function ListBlock({ keyName, entry, pulse }: { keyName: string; entry: Extract<RedisEntry, { type: 'list' }>; pulse?: 'new' | 'changed' }) {
  return (
    <div className={`viz-block ${pulse ? `viz-block-pulse--${pulse}` : ''}`}>
      <div className="viz-block-header">
        <span className="viz-type-badge viz-type-badge--list">LIST</span>
        <span className="viz-key-name">{keyName}</span>
        <span className="viz-block-meta">Length: {entry.value.length}</span>
      </div>
      <div className="viz-list-nodes">
        <span className="viz-list-bound">HEAD</span>
        {entry.value.map((item, i) => (
          <div
            key={`${keyName}-${i}-${pulse ?? 'static'}`}
            className={`viz-list-node ${i === 0 ? 'viz-list-node--head' : ''} ${pulse ? 'viz-node-enter' : ''}`}
            style={pulse ? { animationDelay: `${i * 40}ms` } : undefined}
          >
            <div className="viz-list-node-index">Index: {i}</div>
            <div className="viz-list-node-value">"{item}"</div>
          </div>
        ))}
        <span className="viz-list-bound">TAIL</span>
      </div>
      {entry.ttl > 0 && <div className="viz-ttl-bar"><div className="viz-ttl-fill" style={{ width: `${Math.min(100, (entry.ttl / 3600) * 100)}%`, background: '#4DA6FF' }} /></div>}
    </div>
  );
}

function HashBlock({ keyName, entry, pulse }: { keyName: string; entry: Extract<RedisEntry, { type: 'hash' }>; pulse?: 'new' | 'changed' }) {
  const fields = Object.entries(entry.value);
  return (
    <div className={`viz-block ${pulse ? `viz-block-pulse--${pulse}` : ''}`}>
      <div className="viz-block-header">
        <span className="viz-type-badge viz-type-badge--hash">HASH</span>
        <span className="viz-key-name">{keyName}</span>
        <span className="viz-block-meta">Fields: {fields.length}</span>
      </div>
      <div className="viz-hash-table">
        <div className="viz-hash-header"><span>FIELD</span><span>VALUE</span></div>
        {fields.map(([k, v]) => (
          <div key={k} className={`viz-hash-row ${pulse === 'changed' ? 'viz-hash-row-pulse' : ''}`}>
            <span className="viz-hash-field">"{k}"</span>
            <span className="viz-hash-val">
              "{v}"
              {pulse === 'changed' && (
                <span className="material-symbols-outlined viz-hash-edit-icon">edit</span>
              )}
            </span>
          </div>
        ))}
      </div>
      {entry.ttl > 0 && <div className="viz-ttl-bar"><div className="viz-ttl-fill" style={{ width: `${Math.min(100, (entry.ttl / 300) * 100)}%`, background: entry.ttl <= 60 ? '#FFB800' : '#4DA6FF' }} /></div>}
    </div>
  );
}

function SetBlock({ keyName, entry, pulse }: { keyName: string; entry: Extract<RedisEntry, { type: 'set' }>; pulse?: 'new' | 'changed' }) {
  return (
    <div className={`viz-block ${pulse ? `viz-block-pulse--${pulse}` : ''}`}>
      <div className="viz-block-header">
        <span className="viz-type-badge viz-type-badge--set">SET</span>
        <span className="viz-key-name">{keyName}</span>
        <span className="viz-block-meta">{entry.value.length} unique</span>
      </div>
      <div className="viz-set-pills">
        {entry.value.map((m) => <span key={m} className="viz-set-pill">'{m}'</span>)}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

interface VisualizerPageProps {
  redisState: UseRedisStateReturn;
}

export function VisualizerPage({ redisState }: VisualizerPageProps) {
  const { currentState, timeline, history, latestDiff } = redisState;

  const [liveSync, setLiveSync] = useState(true);
  const [activeStep, setActiveStep] = useState(-1); // -1 = idle, 0-3 = trace step
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [bannerDismissedFor, setBannerDismissedFor] = useState(-1);

  const lastTimelineLength = useRef(timeline.length);
  const stepTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const entries = Object.entries(currentState);

  // ── Drive execution trace from real command timeline ────────────────────────
  useEffect(() => {
    if (timeline.length === lastTimelineLength.current) return;
    lastTimelineLength.current = timeline.length;

    // Clear any in-flight sequence
    stepTimers.current.forEach(clearTimeout);
    stepTimers.current = [];

    const latest = timeline[timeline.length - 1];
    if (!latest) return;

    // Sequential pulse: INPUT -> INTERPRET -> DELTA -> VISUALIZE
    [0, 1, 2, 3].forEach((step) => {
      const t = setTimeout(() => setActiveStep(step), step * 120);
      stepTimers.current.push(t);
    });

    // Record latency at the moment the trace fires
    const latencyTimer = setTimeout(() => {
      setLatencyMs(Date.now() - new Date(latest.timestamp).getTime());
    }, 360);
    stepTimers.current.push(latencyTimer);

    return () => {
      stepTimers.current.forEach(clearTimeout);
    };
  }, [timeline]);

  // ── WRONGTYPE banner detection ───────────────────────────────────────────────
  const latestHistoryLine = history[history.length - 1];
  const wrongtypeMatch = latestHistoryLine?.match(/ERROR:\s*(WRONGTYPE:.*)/);
  const showBanner = !!wrongtypeMatch && bannerDismissedFor !== history.length;

  // ── Per-key pulse classification (same approach as Phase 4) ─────────────────
  const pulseMap = new Map<string, 'new' | 'changed'>();
  if (latestDiff) {
    for (const change of latestDiff.changes) {
      if (change.kind === 'added')    pulseMap.set(change.key, 'new');
      if (change.kind === 'modified') pulseMap.set(change.key, 'changed');
    }
  }

  const latest = timeline[timeline.length - 1];

  return (
    <div className="visualizer-page">

      {/* ── Canvas title bar ── */}
      <div className="viz-title-bar">
        <div className="viz-title-left">
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#DC143C' }}>account_tree</span>
          <span className="viz-title-text">Structure Canvas</span>
          <span className="viz-title-sep">|</span>
          <span className="viz-title-breadcrumb">db0 &gt; {entries.length} keys</span>
        </div>
        <div className="viz-title-right">
          <button
            className={`viz-live-sync-btn ${liveSync ? 'viz-live-sync-btn--active' : ''}`}
            onClick={() => setLiveSync((v) => !v)}
          >
            LIVE SYNC
          </button>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#555' }}>pause_circle</span>
        </div>
      </div>

      {/* ── Execution trace pipeline ── */}
      <div className="viz-trace-bar">
        <div className="viz-trace-row">
          <div className="viz-trace-steps">
            {TRACE_STEPS.map((step, i) => (
              <span
                key={step}
                className={`viz-trace-step ${activeStep === i ? 'viz-trace-step--active viz-trace-step--pulse' : activeStep > i ? 'viz-trace-step--done' : ''}`}
              >
                {step} {i < TRACE_STEPS.length - 1 ? '·' : ''}
              </span>
            ))}
          </div>
          <span className="viz-trace-latency">
            {latencyMs !== null ? `Latency: ${latencyMs}ms` : 'Latency: —'}
          </span>
        </div>
        <div className="viz-trace-command">
          {latest ? (
            <>&gt; <span className="viz-trace-command-text">{latest.command}</span></>
          ) : (
            <span className="viz-trace-command-empty">No commands executed yet — run something in the Lab</span>
          )}
        </div>
      </div>

      {/* ── WRONGTYPE banner ── */}
      {showBanner && wrongtypeMatch && (
        <div className="viz-wrongtype-banner">
          <span className="material-symbols-outlined viz-wrongtype-icon">warning</span>
          <div className="viz-wrongtype-text">
            <strong>WRONGTYPE Operation</strong>
            <span>{wrongtypeMatch[1]}</span>
          </div>
          <button
            className="viz-wrongtype-dismiss"
            onClick={() => setBannerDismissedFor(history.length)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
          </button>
        </div>
      )}

      {/* ── Structure canvas ── */}
      <div className="viz-canvas">
        {entries.length === 0 ? (
          <div className="viz-empty">
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#333' }}>account_tree</span>
            <p>No keys in Redis. Run some commands in the Lab to see structures here.</p>
          </div>
        ) : (
          entries.map(([key, entry]) => {
            const pulse = pulseMap.get(key);
            if (entry.type === 'string') return <StringBlock key={key} keyName={key} entry={entry} pulse={pulse} />;
            if (entry.type === 'list')   return <ListBlock   key={key} keyName={key} entry={entry} pulse={pulse} />;
            if (entry.type === 'hash')   return <HashBlock   key={key} keyName={key} entry={entry} pulse={pulse} />;
            if (entry.type === 'set')    return <SetBlock    key={key} keyName={key} entry={entry} pulse={pulse} />;
            return null;
          })
        )}
      </div>

    </div>
  );
}