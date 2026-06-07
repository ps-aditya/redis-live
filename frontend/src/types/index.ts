// frontend/src/types/index.ts

// ── Redis data types ─────────────────────────────────────────────────────────

export type RedisEntry =
  | { type: "string";  value: string;                   ttl: number }
  | { type: "list";    value: string[];                  ttl: number }
  | { type: "hash";    value: Record<string, string>;    ttl: number }
  | { type: "set";     value: string[];                  ttl: number }
  | { type: "unknown"; value: null;                      ttl: number };

export type RedisSnapshot = Record<string, RedisEntry>;

// ── Diff types ───────────────────────────────────────────────────────────────

export interface AddedKey {
  kind: "added";
  key: string;
  entry: RedisEntry;
}

export interface DeletedKey {
  kind: "deleted";
  key: string;
  previous: RedisEntry;
}

export interface ModifiedKey {
  kind: "modified";
  key: string;
  previous: RedisEntry;
  current: RedisEntry;
}

export type DiffChange = AddedKey | DeletedKey | ModifiedKey;

export interface DiffResult {
  changes: DiffChange[];
  hasChanges: boolean;
}

// ── Timeline types ────────────────────────────────────────────────────────────

export interface TimelineEntry {
  index: number;           // 1-based for display
  command: string;         // raw command string e.g. "SET user John"
  snapshotBefore: RedisSnapshot;
  snapshotAfter: RedisSnapshot;
  diff: DiffResult;
  timestamp: Date;
}

// ── Experiment types ──────────────────────────────────────────────────────────

// Replace the old Experiment interface with this:

export interface Experiment {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  concepts: string[];
  question: string;
  hypothesis: string;
  description: string;
  commands: string[];
  reflection: string[];
}