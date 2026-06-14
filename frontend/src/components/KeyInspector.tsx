// frontend/src/components/KeyInspector.tsx

import type { RedisEntry } from "../types";

interface KeyInspectorProps {
  keyName: string;
  entry: RedisEntry;
  ttl: number; // smooth, client-interpolated TTL passed from StateViewer
  onExecute: (raw: string) => void;
}

// Rough byte-size estimate for display purposes
function estimateSize(entry: RedisEntry): string {
  let bytes = 0;
  if (entry.type === "string") bytes = entry.value.length;
  else if (entry.type === "list") bytes = entry.value.join("").length;
  else if (entry.type === "hash") bytes = Object.entries(entry.value).reduce((acc, [k, v]) => acc + k.length + v.length, 0);
  else if (entry.type === "set") bytes = entry.value.join("").length;
  return `${bytes}B`;
}

// Cosmetic encoding heuristic — mirrors the Stitch reference's "ziplist" labels
function estimateEncoding(entry: RedisEntry): string {
  if (entry.type === "string") return "raw";
  if (entry.type === "list") return entry.value.length <= 128 ? "listpack" : "quicklist";
  if (entry.type === "hash") return Object.keys(entry.value).length <= 128 ? "listpack" : "hashtable";
  if (entry.type === "set") return entry.value.length <= 128 ? "listpack" : "hashtable";
  return "unknown";
}

function fieldCount(entry: RedisEntry): string {
  if (entry.type === "hash") return String(Object.keys(entry.value).length);
  if (entry.type === "list" || entry.type === "set") return String(entry.value.length);
  return "—";
}

// Pretty-printed JSON-ish view of the raw value
function renderRawValue(entry: RedisEntry): string {
  if (entry.type === "string") return JSON.stringify(entry.value, null, 2);
  if (entry.type === "list")   return JSON.stringify(entry.value, null, 2);
  if (entry.type === "hash")   return JSON.stringify(entry.value, null, 2);
  if (entry.type === "set")    return JSON.stringify(entry.value, null, 2);
  return "null";
}

export function KeyInspector({ keyName, entry, ttl, onExecute }: KeyInspectorProps) {
  function handleCopyName() {
    navigator.clipboard?.writeText(keyName).catch(() => {});
  }

  function handleDelete() {
    onExecute(`DEL ${keyName}`);
  }

  const ttlDisplay = ttl === -1 ? "-1 (Persistent)" : ttl === -2 ? "EVICTED" : `${ttl}s`;

  return (
    <div className="key-inspector">
      <div className="key-inspector-meta">
        <div className="key-inspector-meta-cell">
          <span className="key-inspector-meta-label">TTL</span>
          <span className="key-inspector-meta-value">{ttlDisplay}</span>
        </div>
        <div className="key-inspector-meta-cell">
          <span className="key-inspector-meta-label">ENCODING</span>
          <span className="key-inspector-meta-value">{estimateEncoding(entry)}</span>
        </div>
        <div className="key-inspector-meta-cell">
          <span className="key-inspector-meta-label">SIZE</span>
          <span className="key-inspector-meta-value">{estimateSize(entry)}</span>
        </div>
        <div className="key-inspector-meta-cell">
          <span className="key-inspector-meta-label">FIELDS</span>
          <span className="key-inspector-meta-value">{fieldCount(entry)}</span>
        </div>
      </div>

      <div className="key-inspector-value">
        <div className="key-inspector-value-header">
          <span className="key-inspector-value-label">VALUE DATA</span>
        </div>
        <pre className="key-inspector-value-body">{renderRawValue(entry)}</pre>
      </div>

      <div className="key-inspector-actions">
        <button className="key-inspector-btn" onClick={handleCopyName}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>content_copy</span>
          Copy Name
        </button>
        <button className="key-inspector-btn key-inspector-btn--danger" onClick={handleDelete}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
          Delete Key (DEL)
        </button>
      </div>
    </div>
  );
}