// frontend/src/pages/VisualizerPage.tsx

import { useState } from 'react';
import type { UseRedisStateReturn } from '../hooks/useRedisState';
import type { RedisEntry } from '../types';

const TRACE_STEPS = ['INPUT', 'INTERPRET', 'DELTA', 'VISUALIZE'];

function StringBlock({ keyName, entry }: { keyName: string; entry: Extract<RedisEntry, { type: 'string' }> }) {
  return (
    <div className="viz-block">
      <div className="viz-block-header">
        <span className="viz-type-badge viz-type-badge--string">STRING</span>
        <span className="viz-key-name">{keyName}</span>
      </div>
      <div className="viz-string-value">{entry.value || '(empty)'}</div>
      {entry.ttl > 0 && <div className="viz-ttl-bar"><div className="viz-ttl-fill" style={{ width: `${Math.min(100, (entry.ttl / 300) * 100)}%`, background: entry.ttl <= 10 ? '#FF3B3B' : entry.ttl <= 60 ? '#FFB800' : '#4DA6FF' }} /></div>}
    </div>
  );
}

function ListBlock({ keyName, entry }: { keyName: string; entry: Extract<RedisEntry, { type: 'list' }> }) {
  return (
    <div className="viz-block">
      <div className="viz-block-header">
        <span className="viz-type-badge viz-type-badge--list">LIST</span>
        <span className="viz-key-name">{keyName}</span>
        <span className="viz-block-meta">Length: {entry.value.length}</span>
      </div>
      <div className="viz-list-nodes">
        <span className="viz-list-bound">HEAD</span>
        {entry.value.map((item, i) => (
          <div key={i} className={`viz-list-node ${i === 0 ? 'viz-list-node--head' : ''}`}>
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

function HashBlock({ keyName, entry }: { keyName: string; entry: Extract<RedisEntry, { type: 'hash' }> }) {
  const fields = Object.entries(entry.value);
  return (
    <div className="viz-block">
      <div className="viz-block-header">
        <span className="viz-type-badge viz-type-badge--hash">HASH</span>
        <span className="viz-key-name">{keyName}</span>
        <span className="viz-block-meta">Fields: {fields.length}</span>
      </div>
      <div className="viz-hash-table">
        <div className="viz-hash-header"><span>FIELD</span><span>VALUE</span></div>
        {fields.map(([k, v]) => (
          <div key={k} className="viz-hash-row">
            <span className="viz-hash-field">"{k}"</span>
            <span className="viz-hash-val">"{v}"</span>
          </div>
        ))}
      </div>
      {entry.ttl > 0 && <div className="viz-ttl-bar"><div className="viz-ttl-fill" style={{ width: `${Math.min(100, (entry.ttl / 300) * 100)}%`, background: entry.ttl <= 60 ? '#FFB800' : '#4DA6FF' }} /></div>}
    </div>
  );
}

function SetBlock({ keyName, entry }: { keyName: string; entry: Extract<RedisEntry, { type: 'set' }> }) {
  return (
    <div className="viz-block">
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

interface VisualizerPageProps {
  redisState: UseRedisStateReturn;
}

export function VisualizerPage({ redisState }: VisualizerPageProps) {
  const { currentState } = redisState;
  const [activeStep, setActiveStep] = useState(2);
  const [liveSync, setLiveSync] = useState(true);

  const entries = Object.entries(currentState);

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
        <div className="viz-trace-steps">
          {TRACE_STEPS.map((step, i) => (
            <button
              key={step}
              onClick={() => setActiveStep(i)}
              className={`viz-trace-step ${activeStep === i ? 'viz-trace-step--active' : ''}`}
            >
              {step} ·
            </button>
          ))}
        </div>
        <span className="viz-trace-latency">Latency: 0.12ms</span>
      </div>

      {/* ── Structure canvas ── */}
      <div className="viz-canvas">
        {entries.length === 0 ? (
          <div className="viz-empty">
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#333' }}>account_tree</span>
            <p>No keys in Redis. Run some commands in the Lab to see structures here.</p>
          </div>
        ) : (
          entries.map(([key, entry]) => {
            if (entry.type === 'string') return <StringBlock key={key} keyName={key} entry={entry} />;
            if (entry.type === 'list')   return <ListBlock   key={key} keyName={key} entry={entry} />;
            if (entry.type === 'hash')   return <HashBlock   key={key} keyName={key} entry={entry} />;
            if (entry.type === 'set')    return <SetBlock    key={key} keyName={key} entry={entry} />;
            return null;
          })
        )}
      </div>

    </div>
  );
}