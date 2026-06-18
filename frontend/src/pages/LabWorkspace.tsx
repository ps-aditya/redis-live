// frontend/src/pages/LabWorkspace.tsx

import { CommandConsole } from '../components/CommandConsole';
import { StateViewer }    from '../components/StateViewer';
import { DiffPanel }      from '../components/DiffPanel';
import { TimelinePanel }  from '../components/TimelinePanel';
import type { UseRedisStateReturn } from '../hooks/useRedisState';

interface LabWorkspaceProps {
  redisState: UseRedisStateReturn;
  sandbox: string;
  onNavigate: (page: string) => void;
}

export function LabWorkspace({ redisState, onNavigate }: LabWorkspaceProps) {
  const {
    currentState, isLoadingState, lastUpdated,
    isExecuting, handleExecute, history,
    timeline, selectedEntry, selectEntry,
    latestDiff, isReplaying, replayState,
  } = redisState;

  const displayState = isReplaying && replayState !== null ? replayState : currentState;

  return (
    <div className="lab-workspace">

      {/* ── Sub-nav ── */}
      <div className="lab-subnav">
        <span className="lab-subnav-tab lab-subnav-tab--active">Lab</span>
        <button className="lab-subnav-link" onClick={() => onNavigate('experiment')}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>science</span>
          Open Experiments
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
        </button>
      </div>

      {/* ── Replay banner ── */}
      {isReplaying && (
        <div className="replay-banner">
          <span className="replay-dot" />
          Replaying {timeline.length} steps — watch the state panel
        </div>
      )}

      {/* ── Main lab: 3 columns ── */}
      <div className="workspace-body">
        <CommandConsole onExecute={handleExecute} history={history} isLoading={isExecuting} />
        <div className="center-column">
          <StateViewer
            state={displayState}
            isLoading={isLoadingState && !isReplaying}
            lastUpdated={lastUpdated}
            latestDiff={latestDiff}
            onExecute={handleExecute}
          />
          <DiffPanel diff={latestDiff} />
        </div>
        <TimelinePanel
          timeline={timeline}
          selectedEntry={selectedEntry}
          onSelect={selectEntry}
          onReplay={redisState.startReplay}
          isReplaying={isReplaying}
        />
      </div>

    </div>
  );
}