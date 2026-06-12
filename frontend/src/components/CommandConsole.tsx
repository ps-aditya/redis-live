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
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever history grows
  useEffect(() => {
    const el = outputRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history]);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed) return;
    onExecute(trimmed);
    setInput("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="console-panel">
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
          {/* Highlighted overlay — purely visual, sits behind the real input */}
          <div className="console-input-overlay" aria-hidden="true">
            <HighlightedCommand text={input} />
            <span className="console-cursor" />
          </div>

          {/* Real input — transparent text, handles all interaction */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
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