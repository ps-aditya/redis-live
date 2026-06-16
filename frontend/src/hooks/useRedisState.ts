// frontend/src/hooks/useRedisState.ts

import { useState, useCallback, useEffect, useRef } from "react";
import { fetchState, executeCommand } from "../api/redisApi";
import { parseCommand } from "../utils/parseCommand";
import { computeDiff } from "../services/diffEngine";
import type { RedisSnapshot, TimelineEntry, DiffResult } from "../types";

export interface UseRedisStateReturn {
  // Current live state
  currentState: RedisSnapshot;
  isLoadingState: boolean;
  lastUpdated: Date | null;

  // Command execution
  isExecuting: boolean;
  handleExecute: (raw: string) => Promise<void>;

  // History (console lines)
  history: string[];

  // Timeline (structured entries with snapshots + diffs)
  timeline: TimelineEntry[];
  selectedEntry: TimelineEntry | null;
  selectEntry: (entry: TimelineEntry | null) => void;

  // Latest diff (shown after most recent command)
  latestDiff: DiffResult | null;

  // Replay
  isReplaying: boolean;
  replayState: RedisSnapshot | null;  // non-null only during replay
  startReplay: () => void;
  stopReplay: () => void;
}

export function useRedisState(): UseRedisStateReturn {
  const [currentState, setCurrentState]     = useState<RedisSnapshot>({});
  const [history, setHistory]               = useState<string[]>([]);
  const [isExecuting, setIsExecuting]       = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [lastUpdated, setLastUpdated]       = useState<Date | null>(null);
  const [timeline, setTimeline]             = useState<TimelineEntry[]>([]);
  const [selectedEntry, setSelectedEntry]   = useState<TimelineEntry | null>(null);
  const [latestDiff, setLatestDiff]         = useState<DiffResult | null>(null);
  const [isReplaying, setIsReplaying]       = useState(false);
  const [replayState, setReplayState]       = useState<RedisSnapshot | null>(null);

  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const snapshotRef   = useRef<RedisSnapshot>({});  // always holds the latest snapshot

  // ── State refresh ──────────────────────────────────────────────────────────

  const refreshState = useCallback(async () => {
    setIsLoadingState(true);
    try {
      const result = await fetchState();
      if (result.success) {
        setCurrentState(result.state);
        setLastUpdated(new Date());
        snapshotRef.current = result.state;
      }
    } finally {
      setIsLoadingState(false);
    }
  }, []);

  // Mount + auto-refresh interval
  useEffect(() => {
    refreshState();
    intervalRef.current = setInterval(refreshState, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshState]);

  // ── Command execution ──────────────────────────────────────────────────────

  const handleExecute = useCallback(async (raw: string) => {
    const parsed = parseCommand(raw);

    if ("error" in parsed) {
      setHistory((prev) => [...prev, `${raw}  ← ERROR: ${parsed.error}`]);
      return;
    }

    setIsExecuting(true);

    // Capture snapshot BEFORE the command runs
    const snapshotBefore: RedisSnapshot = { ...snapshotRef.current };

    try {
      const result = await executeCommand(
        parsed.command,
        "key" in parsed ? parsed.key : undefined,
        "value" in parsed ? parsed.value : undefined,
        "field" in parsed ? parsed.field : undefined
      );

      // Build console history line
      let historyLine = raw;
      if (!result.success) {
        historyLine += `  ← ERROR: ${result.error}`;
      } else {
        switch (parsed.command) {
          case "SET":    historyLine += `  → OK`; break;
          case "GET":    historyLine += `  → "${result.value ?? "(nil)"}"`;  break;
          case "DEL":    historyLine += `  → ${result.deleted === 1 ? "deleted" : "key not found"}`; break;
          case "EXISTS": historyLine += `  → ${result.exists ? "1 (exists)" : "0 (not found)"}`; break;
          case "EXPIRE": historyLine += `  → ${result.applied ? `TTL set to ${result.seconds}s` : "key not found"}`; break;
          case "LPUSH":  historyLine += `  → list length: ${result.length}`; break;
          case "RPOP":   historyLine += `  → "${result.value ?? "(nil)"}" popped`; break;
          case "FLUSHALL": historyLine += `  → all keys flushed`; break;
          case "LPOP":   historyLine += `  → "${result.value ?? "(nil)"}" popped`; break;
          case "LLEN":   historyLine += `  → list length: ${result.len}`; break;
          case "HSET":   historyLine += `  → field ${result.added === 1 ? "added" : "updated"}`; break;
          case "HGET":   historyLine += `  → "${result.value ?? "(nil)"}"`; break;
          case "SADD":   historyLine += `  → ${result.added === 1 ? "added (new)" : "already a member"}`; break;
          case "SREM":   historyLine += `  → ${result.removed === 1 ? "removed" : "not a member"}`; break;
        }
      }

      setHistory((prev) => [...prev, historyLine]);

      // Refresh state to get snapshot AFTER
      await refreshState();
      const snapshotAfter: RedisSnapshot = { ...snapshotRef.current };

      // Compute diff
      const diff = computeDiff(snapshotBefore, snapshotAfter);
      setLatestDiff(diff);

      // Add to timeline (only if command succeeded or was a real Redis interaction)
      const entry: TimelineEntry = {
        index: timeline.length + 1,
        command: raw,
        snapshotBefore,
        snapshotAfter,
        diff,
        timestamp: new Date(),
      };

      setTimeline((prev) => {
        entry.index = prev.length + 1;
        return [...prev, entry];
      });

    } catch {
      setHistory((prev) => [...prev, `${raw}  ← NETWORK ERROR`]);
    } finally {
      setIsExecuting(false);
    }
  }, [refreshState, timeline.length]);

  // ── Replay ─────────────────────────────────────────────────────────────────

  const startReplay = useCallback(() => {
    if (timeline.length === 0) return;
    setIsReplaying(true);

    let i = 0;

    function step() {
      if (i >= timeline.length) {
        setIsReplaying(false);
        setReplayState(null);
        return;
      }
      setReplayState(timeline[i].snapshotAfter);
      i++;
      setTimeout(step, 800);
    }

    // Start from empty
    setReplayState({});
    setTimeout(step, 400);
  }, [timeline]);

  const stopReplay = useCallback(() => {
    setIsReplaying(false);
    setReplayState(null);
  }, []);

  return {
    currentState,
    isLoadingState,
    lastUpdated,
    isExecuting,
    handleExecute,
    history,
    timeline,
    selectedEntry,
    selectEntry: setSelectedEntry,
    latestDiff,
    isReplaying,
    replayState,
    startReplay,
    stopReplay,
  };
}