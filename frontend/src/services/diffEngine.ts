// frontend/src/services/diffEngine.ts

import type { RedisSnapshot, DiffResult, DiffChange, RedisEntry } from "../types";

// Serialize a RedisEntry value to a string for equality comparison
function serializeValue(entry: RedisEntry): string {
  if (entry.type === "string")  return entry.value;
  if (entry.type === "list")    return JSON.stringify(entry.value);
  if (entry.type === "hash")    return JSON.stringify(entry.value);
  if (entry.type === "set")     return JSON.stringify([...entry.value].sort());
  return "null";
}

export function computeDiff(
  before: RedisSnapshot,
  after: RedisSnapshot
): DiffResult {
  const changes: DiffChange[] = [];

  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const hadKey = key in before;
    const hasKey = key in after;

    if (!hadKey && hasKey) {
      // Key was added
      changes.push({ kind: "added", key, entry: after[key] });

    } else if (hadKey && !hasKey) {
      // Key was deleted
      changes.push({ kind: "deleted", key, previous: before[key] });

    } else if (hadKey && hasKey) {
      // Key exists in both — check if value or TTL changed
      const prevVal = serializeValue(before[key]);
      const currVal = serializeValue(after[key]);
      const ttlChanged = before[key].ttl !== after[key].ttl;

      if (prevVal !== currVal || ttlChanged) {
        changes.push({
          kind: "modified",
          key,
          previous: before[key],
          current: after[key],
        });
      }
    }
  }

  return { changes, hasChanges: changes.length > 0 };
}

// Format a RedisEntry value as a short human-readable string
export function formatEntryValue(entry: RedisEntry): string {
  if (entry.type === "string") return `"${entry.value}"`;
  if (entry.type === "list")   return `[${entry.value.join(", ")}]`;
  if (entry.type === "hash")   return `{${Object.entries(entry.value).map(([k,v]) => `${k}: ${v}`).join(", ")}}`;
  if (entry.type === "set")    return `{${entry.value.join(", ")}}`;
  return "(unknown)";
}