// frontend/src/components/StateViewer.tsx

import { useEffect, useRef } from "react";
import type { RedisEntry } from "../types";

// ── TTL Bar ──────────────────────────────────────────────────────────────────

function TTLBar({ ttl }: { ttl: number }) {
  if (ttl === -1) return <span className="ttl-persistent">∞ Persistent</span>;
  if (ttl === -2) return <span className="ttl-expired">EVICTED</span>;

  const isUrgent  = ttl <= 10;
  const isWarning = ttl <= 60;
  const colorClass = isUrgent ? "ttl-urgent" : isWarning ? "ttl-warning" : "ttl-ok";

  return (
    <div className="ttl-row">
      <span className={`ttl-label ${colorClass}`}>TTL</span>
      <span className={`ttl-value ${colorClass}`}>{ttl}s</span>
      <div className="ttl-bar-track">
        <div
          className={`ttl-bar-fill ${colorClass}`}
          style={{ width: `${Math.min(100, (ttl / 300) * 100)}%` }}
        />
      </div>
    </div>
  );
}

// ── String Card ──────────────────────────────────────────────────────────────

function StringCard({ keyName, entry }: {
  keyName: string;
  entry: Extract<RedisEntry, { type: "string" }>;
}) {
  return (
    <div className="redis-card redis-card--string">
      <div className="card-header">
        <span className="card-type-badge badge--string">STRING</span>
        <span className="card-key">{keyName}</span>
      </div>
      <div className="card-value string-value">{entry.value}</div>
      <TTLBar ttl={entry.ttl} />
    </div>
  );
}

// ── List Card ────────────────────────────────────────────────────────────────

function ListCard({ keyName, entry }: {
  keyName: string;
  entry: Extract<RedisEntry, { type: "list" }>;
}) {
  return (
    <div className="redis-card redis-card--list">
      <div className="card-header">
        <span className="card-type-badge badge--list">LIST</span>
        <span className="card-key">{keyName}</span>
        <span className="card-meta">{entry.value.length} item{entry.value.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="list-nodes">
        {entry.value.length === 0 ? (
          <div className="list-empty">(empty list)</div>
        ) : (
          entry.value.map((item, i) => (
            <div key={i} className="list-node">
              <span className="list-index">[{i}]</span>
              <span className="list-item-value">{item}</span>
              {i === 0 && <span className="list-head-tag">HEAD</span>}
              {i === entry.value.length - 1 && entry.value.length > 1 && (
                <span className="list-tail-tag">TAIL</span>
              )}
            </div>
          ))
        )}
      </div>
      <TTLBar ttl={entry.ttl} />
    </div>
  );
}

// ── Hash Card ────────────────────────────────────────────────────────────────

function HashCard({ keyName, entry }: {
  keyName: string;
  entry: Extract<RedisEntry, { type: "hash" }>;
}) {
  const fields = Object.entries(entry.value);
  return (
    <div className="redis-card redis-card--hash">
      <div className="card-header">
        <span className="card-type-badge badge--hash">HASH</span>
        <span className="card-key">{keyName}</span>
        <span className="card-meta">{fields.length} field{fields.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="hash-table">
        <div className="hash-header-row">
          <span className="hash-col-label">FIELD</span>
          <span className="hash-col-label">VALUE</span>
        </div>
        {fields.map(([field, val]) => (
          <div key={field} className="hash-row">
            <span className="hash-field">{field}</span>
            <span className="hash-val">{val}</span>
          </div>
        ))}
      </div>
      <TTLBar ttl={entry.ttl} />
    </div>
  );
}

// ── Set Card ─────────────────────────────────────────────────────────────────

function SetCard({ keyName, entry }: {
  keyName: string;
  entry: Extract<RedisEntry, { type: "set" }>;
}) {
  return (
    <div className="redis-card redis-card--set">
      <div className="card-header">
        <span className="card-type-badge badge--set">SET</span>
        <span className="card-key">{keyName}</span>
        <span className="card-meta">{entry.value.length} unique</span>
      </div>
      <div className="set-pills">
        {entry.value.map((member) => (
          <span key={member} className="set-pill">{member}</span>
        ))}
      </div>
      <TTLBar ttl={entry.ttl} />
    </div>
  );
}

// ── Animated wrapper — flashes on mount ──────────────────────────────────────

function AnimatedCard({ children, keyName }: { children: React.ReactNode; keyName: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("card-flash");
    const t = setTimeout(() => el.classList.remove("card-flash"), 600);
    return () => clearTimeout(t);
  }, [keyName]);

  return <div ref={ref}>{children}</div>;
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

function RedisCard({ keyName, entry }: { keyName: string; entry: RedisEntry }) {
  if (entry.type === "string") return <StringCard keyName={keyName} entry={entry} />;
  if (entry.type === "list")   return <ListCard   keyName={keyName} entry={entry} />;
  if (entry.type === "hash")   return <HashCard   keyName={keyName} entry={entry} />;
  if (entry.type === "set")    return <SetCard    keyName={keyName} entry={entry} />;
  return (
    <div className="redis-card redis-card--unknown">
      <div className="card-type-badge badge--unknown">UNKNOWN</div>
      <div className="card-key">{keyName}</div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface StateViewerProps {
  state: Record<string, RedisEntry>;
  isLoading: boolean;
  lastUpdated: Date | null;
}

export function StateViewer({ state, isLoading, lastUpdated }: StateViewerProps) {
  const entries = Object.entries(state);

  return (
    <div className="state-panel">
      <div className="state-header">
        <span className="state-title">Redis State</span>
        <div className="state-header-right">
          <span className="state-key-count">
            {entries.length} key{entries.length !== 1 ? "s" : ""}
          </span>
          <span className="state-meta">
            {isLoading ? "refreshing..." : lastUpdated ? `${lastUpdated.toLocaleTimeString()}` : ""}
          </span>
        </div>
      </div>

      <div className="state-body">
        {entries.length === 0 ? (
          <div className="state-empty-block">
            <div className="state-empty-icon">⬡</div>
            <div className="state-empty-label">Keyspace is empty</div>
            <div className="state-empty-hint">Try: <code>SET user John</code></div>
          </div>
        ) : (
          entries.map(([key, entry]) => (
            <AnimatedCard key={key} keyName={key}>
              <RedisCard keyName={key} entry={entry} />
            </AnimatedCard>
          ))
        )}
      </div>
    </div>
  );
}