// frontend/src/components/TimelinePanel.tsx

import type { TimelineEntry } from "../types";
import { formatEntryValue } from "../services/diffEngine";

interface TimelinePanelProps {
  timeline: TimelineEntry[];
  selectedEntry: TimelineEntry | null;
  onSelect: (entry: TimelineEntry | null) => void;
  onReplay: () => void;
  isReplaying: boolean;
}

export function TimelinePanel({
  timeline,
  selectedEntry,
  onSelect,
  onReplay,
  isReplaying,
}: TimelinePanelProps) {
  return (
    <div className="timeline-panel">
      <div className="timeline-header">
        <span className="timeline-title">Timeline</span>
        <div className="timeline-actions">
          {selectedEntry && (
            <button
              className="timeline-clear-btn"
              onClick={() => onSelect(null)}
            >
              ✕ Clear
            </button>
          )}
          <button
            className="timeline-replay-btn"
            onClick={isReplaying ? undefined : onReplay}
            disabled={timeline.length === 0 || isReplaying}
          >
            {isReplaying ? "⏸ Replaying..." : "▶ Replay"}
          </button>
        </div>
      </div>

      <div className="timeline-body">
        {timeline.length === 0 ? (
          <p className="timeline-empty">
            Commands will appear here.<br />
            Click any entry to inspect it.
          </p>
        ) : (
          [...timeline].reverse().map((entry) => {
            const isSelected = selectedEntry?.index === entry.index;
            const changeCount = entry.diff.changes.length;

            return (
              <div
                key={entry.index}
                className={`timeline-entry ${isSelected ? "timeline-entry--selected" : ""}`}
                onClick={() => onSelect(isSelected ? null : entry)}
              >
                <div className="timeline-entry-top">
                  <span className="timeline-index">[{entry.index}]</span>
                  <span className="timeline-cmd">{entry.command}</span>
                  {changeCount > 0 && (
                    <span className="timeline-badge">
                      {changeCount} change{changeCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="timeline-entry-time">
                  {entry.timestamp.toLocaleTimeString()}
                </div>

                {isSelected && (
                  <div className="timeline-detail">
                    <div className="timeline-section-label">BEFORE</div>
                    <div className="timeline-snapshot">
                      {Object.keys(entry.snapshotBefore).length === 0
                        ? <span className="timeline-empty-snap">(empty)</span>
                        : Object.entries(entry.snapshotBefore).map(([k, v]) => (
                          <div key={k} className="timeline-snap-row">
                            <span className="timeline-snap-key">{k}</span>
                            <span className="timeline-snap-sep">→</span>
                            <span className="timeline-snap-val">{formatEntryValue(v)}</span>
                          </div>
                        ))
                      }
                    </div>

                    <div className="timeline-section-label">AFTER</div>
                    <div className="timeline-snapshot">
                      {Object.keys(entry.snapshotAfter).length === 0
                        ? <span className="timeline-empty-snap">(empty)</span>
                        : Object.entries(entry.snapshotAfter).map(([k, v]) => (
                          <div key={k} className="timeline-snap-row">
                            <span className="timeline-snap-key">{k}</span>
                            <span className="timeline-snap-sep">→</span>
                            <span className="timeline-snap-val">{formatEntryValue(v)}</span>
                          </div>
                        ))
                      }
                    </div>

                    {entry.diff.hasChanges && (
                      <>
                        <div className="timeline-section-label">DIFF</div>
                        <div className="timeline-diff-list">
                          {entry.diff.changes.map((change, i) => (
                            <div key={i} className={`timeline-diff-row diff-${change.kind}`}>
                              {change.kind === "added" && (
                                <span>+ <strong>{change.key}</strong> added — {formatEntryValue(change.entry)}</span>
                              )}
                              {change.kind === "deleted" && (
                                <span>− <strong>{change.key}</strong> deleted</span>
                              )}
                              {change.kind === "modified" && (
                                <span>~ <strong>{change.key}</strong>: {formatEntryValue(change.previous)} → {formatEntryValue(change.current)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}