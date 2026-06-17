// frontend/src/components/CommandConsole.tsx

import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { HighlightedCommand } from "../utils/syntaxHighlight";

interface CommandConsoleProps {
  onExecute: (raw: string) => void;
  history: string[];
  isLoading: boolean;
}

export function CommandConsole({ onExecute, history, isLoading }: CommandConsoleProps) {
  const [input, setInput] = useState("");

  // ── Command-only history (just what was sent, not response text) ────────────
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null); // null = not browsing
  const draftRef = useRef(""); // preserves in-progress input while arrowing through history

  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom whenever history grows
  useEffect(() => {
    const el = outputRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history]);

  // ── Refocus on browser tab/window regaining focus ───────────────────────────
  useEffect(() => {
    function handleWindowFocus() {
      inputRef.current?.focus();
    }
    window.addEventListener("focus", handleWindowFocus);
    return () => window.removeEventListener("focus", handleWindowFocus);
  }, []);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed) return;
    onExecute(trimmed);
    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(null);
    draftRef.current = "";
    setInput("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleSubmit();
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;

      if (historyIndex === null) {
        // Entering history browsing — save current draft
        draftRef.current = input;
        const newIndex = commandHistory.length - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === null) return; // not browsing, nothing to do

      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else {
        // Past the most recent — restore the in-progress draft
        setHistoryIndex(null);
        setInput(draftRef.current);
      }
      return;
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
    // Manual typing exits history-browsing mode
    if (historyIndex !== null) {
      setHistoryIndex(null);
    }
  }

  return (
    <div className="console-panel" onClick={() => inputRef.current?.focus()}>
      <div className="console-output" ref={outputRef}>
        {history.length === 0 && (
          <p className="console-empty">No commands yet. Try: SET user John</p>
        )}
        {history.map((line, i) => (
          <div key={i} className="console-line">
            <span className="console-prompt">rse:6379&gt;</span>
            <span className="console-text">
              <HighlightedCommand text={line} />
            </span>
          </div>
        ))}
      </div>

      <div className="console-input-row">
        <span className="console-prompt">rse:6379&gt;</span>

        <div className="console-input-wrap">
          <div className="console-input-overlay" aria-hidden="true">
            <HighlightedCommand text={input} />
            <span className="console-cursor" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={input ? "" : "SET user John"}
            disabled={isLoading}
            className="console-input"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || !input.trim()}
          className="console-execute-btn"
        >
          {isLoading ? "..." : "Execute"}
        </button>
      </div>
    </div>
  );
}