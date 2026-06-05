// frontend/src/pages/Workspace.tsx

import { useState, useCallback, useEffect } from "react";
import { CommandConsole } from "../components/CommandConsole";
import { StateViewer } from "../components/StateViewer";
import { parseCommand } from "../utils/parseCommand";
import { executeCommand, fetchState } from "../api/redisApi";

export function Workspace() {
  const [redisState, setRedisState] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load state on first mount
  useEffect(() => {
    refreshState();
  }, []);

  async function refreshState() {
    setIsLoadingState(true);
    try {
      const result = await fetchState();
      if (result.success) {
        setRedisState(result.state);
        setLastUpdated(new Date());
      }
    } finally {
      setIsLoadingState(false);
    }
  }

  const handleExecute = useCallback(async (raw: string) => {
    const parsed = parseCommand(raw);

    // If parse failed, add error to history and stop
    if ("error" in parsed) {
      setHistory((prev) => [...prev, `${raw}  ← ERROR: ${parsed.error}`]);
      return;
    }

    setIsExecuting(true);

    try {
      const result = await executeCommand(
        parsed.command,
        parsed.key,
        "value" in parsed ? parsed.value : undefined
      );

      // Build a readable history line
      let historyLine = raw;
      if (!result.success) {
        historyLine += `  ← ERROR: ${result.error}`;
      } else if (parsed.command === "GET") {
        historyLine += `  → "${result.value ?? "(nil)"}"`;
      } else if (parsed.command === "DEL") {
        historyLine += `  → ${result.deleted === 1 ? "deleted" : "key not found"}`;
      } else if (parsed.command === "EXISTS") {
        historyLine += `  → ${result.exists ? "1 (exists)" : "0 (not found)"}`;
      } else if (parsed.command === "SET") {
        historyLine += `  → OK`;
      }

      setHistory((prev) => [...prev, historyLine]);

      // Always refresh state after any command
      await refreshState();
    } catch (err) {
      setHistory((prev) => [...prev, `${raw}  ← NETWORK ERROR`]);
    } finally {
      setIsExecuting(false);
    }
  }, []);

  return (
    <div className="workspace">
      <header className="workspace-header">
        <span className="workspace-logo">RSE</span>
        <span className="workspace-sub">Redis State Explorer</span>
      </header>

      <div className="workspace-body">
        <CommandConsole
          onExecute={handleExecute}
          history={history}
          isLoading={isExecuting}
        />
        <StateViewer
          state={redisState}
          isLoading={isLoadingState}
          lastUpdated={lastUpdated}
        />
      </div>
    </div>
  );
}