// frontend/src/components/StateViewer.tsx
import { useEffect, useRef, useState, memo, useMemo } from "react";
import type { RedisEntry, DiffResult } from "../types";
import { KeyInspector } from "./KeyInspector";

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

const StringCard = memo(function StringCard({ entry }: { entry: Extract<RedisEntry, { type: "string" }> }) {

  return <div className="card-value string-value">{entry.value}</div>;
});

// ── List Card ────────────────────────────────────────────────────────────────

const ListCard = memo(function ListCard({ entry }: { entry: Extract<RedisEntry, { type: "list" }> }) {
  return (
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
  );
});

// ── Hash Card ────────────────────────────────────────────────────────────────

const HashCard = memo(function HashCard({ entry }: { entry: Extract<RedisEntry, { type: "hash" }> }) {
  const fields = Object.entries(entry.value);
  return (
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
  );
});

// ── Set Card ─────────────────────────────────────────────────────────────────

const SetCard = memo(function SetCard({ entry }: { entry: Extract<RedisEntry, { type: "set" }> }) {
  return (
    <div className="set-pills">
      {entry.value.map((member) => (
        <span key={member} className="set-pill">{member}</span>
      ))}
    </div>
  );
});

// ── Body dispatcher ──────────────────────────────────────────────────────────

const CardBody = memo(function CardBody({ entry }: { entry: RedisEntry }) {

  if (entry.type === "string") return <StringCard entry={entry} />;
  if (entry.type === "list")   return <ListCard   entry={entry} />;
  if (entry.type === "hash")   return <HashCard   entry={entry} />;
  if (entry.type === "set")    return <SetCard    entry={entry} />;
  return null;
});

const TYPE_LABELS: Record<RedisEntry["type"], string> = {
  string: "STRING", list: "LIST", hash: "HASH", set: "SET", unknown: "UNKNOWN",
};

function fieldCountMeta(entry: RedisEntry): string | null {
  if (entry.type === "list") return `${entry.value.length} item${entry.value.length !== 1 ? "s" : ""}`;
  if (entry.type === "hash") {
    const n = Object.keys(entry.value).length;
    return `${n} field${n !== 1 ? "s" : ""}`;
  }
  if (entry.type === "set") return `${entry.value.length} unique`;
  return null;
}

// ── Main export ───────────────────────────────────────────────────────────────

interface StateViewerProps {
  state: Record<string, RedisEntry>;
  isLoading: boolean;
  lastUpdated: Date | null;
  latestDiff: DiffResult | null;
  onExecute: (raw: string) => void;
}

export function StateViewer({ state, isLoading, lastUpdated, latestDiff, onExecute }: StateViewerProps) {
  const entries = useMemo(() => Object.entries(state), [state]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  // ── Smooth 1-second TTL countdown between 2s backend polls ──────────────────
  const [tick, setTick] = useState(0);
  const fetchTimeRef = useRef<Date | null>(lastUpdated);

  useEffect(() => {
    fetchTimeRef.current = lastUpdated;
  }, [lastUpdated]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  function smoothTtl(rawTtl: number): number {
    if (rawTtl < 0) return rawTtl; // -1 persistent, -2 evicted — no interpolation
    const fetchedAt = fetchTimeRef.current?.getTime() ?? Date.now();
    const elapsedSec = Math.floor((Date.now() - fetchedAt) / 1000);
    return Math.max(0, rawTtl - elapsedSec);
  }
  // `tick` is referenced only to trigger re-render every second
  void tick;

  // ── Mutation pulse classification from latestDiff ────────────────────────────
  const pulseMap = new Map<string, "new" | "changed">();
  if (latestDiff) {
    for (const change of latestDiff.changes) {
      if (change.kind === "added")    pulseMap.set(change.key, "new");
      if (change.kind === "modified") pulseMap.set(change.key, "changed");
      // "deleted" keys are no longer in `state` by the time this renders —
      // no card exists to flash red.
    }
  }

  function toggleExpand(key: string) {
    setExpandedKey((prev) => (prev === key ? null : key));
  }

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
          entries.map(([key, entry]) => {
            const pulse = pulseMap.get(key);
            const pulseClass = pulse === "new" ? "row-pulse-new" : pulse === "changed" ? "row-pulse-changed" : "";
            const isExpanded = expandedKey === key;
            const displayTtl = entry.ttl > 0 ? smoothTtl(entry.ttl) : entry.ttl;
            const meta = fieldCountMeta(entry);

            return (
              <div key={key} className={`redis-card redis-card--${entry.type} ${pulseClass}`}>
                <div
                  className="card-header card-header--clickable"
                  onClick={() => toggleExpand(key)}
                >
                  <span className={`card-type-badge badge--${entry.type}`}>{TYPE_LABELS[entry.type]}</span>
                  <span className="card-key">{key}</span>
                  {meta && <span className="card-meta">{meta}</span>}
                  <span className="material-symbols-outlined card-expand-icon">
                    {isExpanded ? "expand_less" : "expand_more"}
                  </span>
                </div>

                <CardBody entry={entry} />

                <TTLBar ttl={displayTtl} />

                {isExpanded && (
                  <KeyInspector
                    keyName={key}
                    entry={entry}
                    ttl={displayTtl}
                    onExecute={onExecute}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}