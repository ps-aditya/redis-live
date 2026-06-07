// frontend/src/components/CommandConsole.tsx

import { useState } from "react";
import type { KeyboardEvent } from "react";
interface CommandConsoleProps {
  onExecute: (raw: string) => void;
  history: string[];
  isLoading: boolean;
}

export function CommandConsole({ onExecute, history, isLoading }: CommandConsoleProps) {
  const [input, setInput] = useState("");

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
      <div className="console-output">
        {history.length === 0 && (
          <p className="console-empty">No commands yet. Try: SET user John</p>
        )}
        {history.map((line, i) => (
          <div key={i} className="console-line">
            <span className="console-prompt">rse:6379&gt;</span>
            <span className="console-text">{line}</span>
          </div>
        ))}
      </div>

      <div className="console-input-row">
        <span className="console-prompt">rse:6379&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="SET user John"
          disabled={isLoading}
          className="console-input"
          autoFocus
          spellCheck={false}
        />
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