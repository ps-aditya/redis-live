// frontend/src/pages/LabWorkspace.tsx

import { useState } from 'react';
import { CommandConsole } from '../components/CommandConsole';
import { StateViewer }    from '../components/StateViewer';
import { DiffPanel }      from '../components/DiffPanel';
import { TimelinePanel }  from '../components/TimelinePanel';
import type { UseRedisStateReturn } from '../hooks/useRedisState';
import { EXPERIMENTS } from '../data/experiments';
import type { Experiment } from '../types';

type LabView = 'lab' | 'experiments';

interface LabWorkspaceProps {
  redisState: UseRedisStateReturn;
  sandbox: string;
}

export function LabWorkspace({ redisState, sandbox }: LabWorkspaceProps) {
  const {
    currentState, isLoadingState, lastUpdated,
    isExecuting, handleExecute, history,
    timeline, selectedEntry, selectEntry,
    latestDiff, isReplaying, replayState, startReplay, stopReplay,
  } = redisState;

  const [view, setView]                         = useState<LabView>('lab');
  const [activeExperiment, setActiveExperiment] = useState<Experiment | null>(null);
  const [expStep, setExpStep]                   = useState(0);

  const displayState = isReplaying && replayState !== null ? replayState : currentState;
  const expDone = activeExperiment !== null && expStep >= activeExperiment.commands.length;

  function startExperiment(exp: Experiment) {
    setActiveExperiment(exp);
    setExpStep(0);
    setView('lab');
  }

  async function runNextStep() {
    if (!activeExperiment || expStep >= activeExperiment.commands.length) return;
    await handleExecute(activeExperiment.commands[expStep]);
    setExpStep((s) => s + 1);
  }

  function closeExperiment() {
    setActiveExperiment(null);
    setExpStep(0);
  }

  return (
    <div className="lab-workspace">

      {/* ── Sub-nav: Lab / Experiments tabs ── */}
      <div className="lab-subnav">
        <button
          className={`lab-subnav-tab ${view === 'lab' ? 'lab-subnav-tab--active' : ''}`}
          onClick={() => setView('lab')}
        >
          Lab
        </button>
        <button
          className={`lab-subnav-tab ${view === 'experiments' ? 'lab-subnav-tab--active' : ''}`}
          onClick={() => setView('experiments')}
        >
          Experiments
          <span className="lab-subnav-badge">{EXPERIMENTS.length}</span>
        </button>
        
      </div>

      {/* ── Replay banner ── */}
      {isReplaying && (
        <div className="replay-banner">
          <span className="replay-dot" />
          Replaying {timeline.length} steps — watch the state panel
        </div>
      )}

      {/* ── Active experiment guide strip ── */}
      {activeExperiment && (
        <div className="exp-guide-strip">
          <div className="exp-guide-left">
            <span className="exp-guide-tag">{activeExperiment.difficulty}</span>
            <span className="exp-guide-title">{activeExperiment.title}</span>
          </div>
          <div className="exp-guide-center">
            {!expDone ? (
              <>
                <span className="exp-guide-step">
                  Step {expStep + 1} of {activeExperiment.commands.length}
                </span>
                <code className="exp-guide-cmd">{activeExperiment.commands[expStep]}</code>
                <button className="exp-run-btn" onClick={runNextStep} disabled={isExecuting}>
                  {isExecuting ? 'Running...' : 'Run this step →'}
                </button>
              </>
            ) : (
              <span className="exp-guide-done">✓ All steps complete — see reflection below</span>
            )}
          </div>
          <div className="exp-guide-progress">
            {activeExperiment.commands.map((_, i) => (
              <div
                key={i}
                className={`exp-progress-dot ${
                  i < expStep ? 'exp-progress-dot--done' : i === expStep ? 'exp-progress-dot--active' : ''
                }`}
              />
            ))}
          </div>
          <button className="exp-close-btn" onClick={closeExperiment} title="Exit experiment">✕</button>
        </div>
      )}

      {/* ── Experiment reflection ── */}
      {expDone && activeExperiment && (
        <div className="exp-reflection-strip">
          <span className="exp-reflection-label">Reflect</span>
          <div className="exp-reflection-questions">
            {activeExperiment.reflection.map((q, i) => (
              <span key={i} className="exp-reflection-q">❓ {q}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Experiment library ── */}
      {view === 'experiments' && (
        <div className="exp-library">
          <div className="exp-library-header">
            <span className="exp-library-title">Experiment Library</span>
            <span className="exp-library-sub">
              Each experiment is a guided question. Run steps one at a time. Watch what changes.
            </span>
          </div>
          <div className="exp-library-grid">
            {EXPERIMENTS.map((exp) => (
              <div key={exp.id} className="exp-card">
                <div className="exp-card-top">
                  <span className={`exp-difficulty exp-difficulty--${exp.difficulty.toLowerCase()}`}>
                    {exp.difficulty}
                  </span>
                  <div className="exp-concepts">
                    {exp.concepts.map((c) => (
                      <span key={c} className="exp-concept-tag">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="exp-card-question">{exp.question}</div>
                <div className="exp-card-hypothesis">
                  <span className="exp-hyp-label">Hypothesis</span>
                  {exp.hypothesis}
                </div>
                <div className="exp-card-desc">{exp.description}</div>
                <div className="exp-card-commands">
                  {exp.commands.map((cmd, i) => (
                    <span key={i} className="exp-cmd-pill">{cmd}</span>
                  ))}
                </div>
                <button className="exp-start-btn" onClick={() => startExperiment(exp)}>
                  Start Experiment →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main lab: 3 columns ── */}
      {view === 'lab' && (
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
            onReplay={startReplay}
            isReplaying={isReplaying}
          />
        </div>
      )}

    </div>
  );
}