// frontend/src/components/StateViewer.tsx

interface StateViewerProps {
  state: Record<string, string>;
  isLoading: boolean;
  lastUpdated: Date | null;
}

export function StateViewer({ state, isLoading, lastUpdated }: StateViewerProps) {
  const entries = Object.entries(state);

  return (
    <div className="state-panel">
      <div className="state-header">
        <span className="state-title">Redis State</span>
        <span className="state-meta">
          {isLoading
            ? "refreshing..."
            : lastUpdated
            ? `updated ${lastUpdated.toLocaleTimeString()}`
            : ""}
        </span>
      </div>

      <div className="state-body">
        {entries.length === 0 ? (
          <p className="state-empty">(empty) — try SET user John</p>
        ) : (
          entries.map(([key, value]) => (
            <div key={key} className="state-row">
              <span className="state-key">{key}</span>
              <span className="state-arrow">→</span>
              <span className="state-value">{value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}