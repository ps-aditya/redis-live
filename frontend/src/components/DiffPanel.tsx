// frontend/src/components/DiffPanel.tsx

import type { DiffResult } from "../types";
import { formatEntryValue } from "../services/diffEngine";

interface DiffPanelProps {
  diff: DiffResult | null;
}

export function DiffPanel({ diff }: DiffPanelProps) {
  return (
    <div className="diff-panel">
      <div className="diff-header">
        <span className="diff-title">Last Change</span>
        {diff?.hasChanges && (
          <span className="diff-count">
            {diff.changes.length} change{diff.changes.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="diff-body">
        {!diff || !diff.hasChanges ? (
          <p className="diff-empty">No changes yet — run a command</p>
        ) : (
          diff.changes.map((change, i) => (
            <div key={i} className={`diff-row diff-row--${change.kind}`}>
              {change.kind === "added" && (
                <>
                  <span className="diff-symbol diff-symbol--added">+</span>
                  <div className="diff-content">
                    <span className="diff-label">Added</span>
                    <span className="diff-key">{change.key}</span>
                    <span className="diff-value">{formatEntryValue(change.entry)}</span>
                  </div>
                </>
              )}
              {change.kind === "deleted" && (
                <>
                  <span className="diff-symbol diff-symbol--deleted">−</span>
                  <div className="diff-content">
                    <span className="diff-label">Deleted</span>
                    <span className="diff-key">{change.key}</span>
                  </div>
                </>
              )}
              {change.kind === "modified" && (
                <>
                  <span className="diff-symbol diff-symbol--modified">~</span>
                  <div className="diff-content">
                    <span className="diff-label">Modified</span>
                    <span className="diff-key">{change.key}</span>
                    <div className="diff-mutation">
                      <span className="diff-before">{formatEntryValue(change.previous)}</span>
                      <span className="diff-arrow">→</span>
                      <span className="diff-after">{formatEntryValue(change.current)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}