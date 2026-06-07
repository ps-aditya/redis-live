// frontend/src/pages/Workspace.tsx

import { useState } from "react";
import { CommandConsole }  from "../components/CommandConsole";
import { StateViewer }     from "../components/StateViewer";
import { DiffPanel }       from "../components/DiffPanel";
import { TimelinePanel }   from "../components/TimelinePanel";
import { useRedisState }   from "../hooks/useRedisState";
import { EXPERIMENTS }     from "../data/experiments";
import type { Experiment } from "../types";

type WorkspaceView = "lab" | "experiments";

export function Workspace() {
  const {
    currentState,
    isLoadingState,
    lastUpdated,
    isExecuting,
    handleExecute,
    history,
    timeline,
    selectedEntry,
    selectEntry,
    latestDiff,
    isReplaying,
    replayState,
    startReplay,
    stopReplay,
  } = useRedisState();

  const [view, setView]                         = useState<WorkspaceView>("lab");
  const [activeExperiment, setActiveExperiment] = useState<Experiment | null>(null);
  const [expStep, setExpStep]                   = useState(0);
  const [expObservations, setExpObservations]   = useState<string[]>([]);

  const displayState = isReplaying && replayState !== null ? replayState : currentState;

  // ── Experiment step-by-step runner ────────────────────────────────────────

  async function startExperiment(exp: Experiment) {
    setActiveExperiment(exp);
    setExpStep(0);
    setExpObservations([]);
    setView("lab");
  }

  async function runNextStep() {
    if (!activeExperiment) return;
    if (expStep >= activeExperiment.commands.length) return;

    const cmd = activeExperiment.commands[expStep];
    await handleExecute(cmd);
    setExpStep((s) => s + 1);
  }

  function closeExperiment() {
    setActiveExperiment(null);
    setExpStep(0);
    setExpObservations([]);
  }

  const expDone = activeExperiment !== null && expStep >= activeExperiment.commands.length;

  return (
    <div className="workspace">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="workspace-header">
        <span className="workspace-logo">RSE</span>
        <span className="workspace-sub">Redis State Explorer</span>

        <nav className="workspace-nav">
          <button
            className={`nav-btn ${view === "lab" ? "nav-btn--active" : ""}`}
            onClick={() => setView("lab")}
          >
            Lab
          </button>
          <button
            className={`nav-btn ${view === "experiments" ? "nav-btn--active" : ""}`}
            onClick={() => setView("experiments")}
          >
            Experiments
            <span className="nav-badge">{EXPERIMENTS.length}</span>
          </button>
        </nav>

        <div className="header-actions">
          {isReplaying ? (
            <button className="header-btn header-btn--danger" onClick={stopReplay}>
              ⏹ Stop Replay
            </button>
          ) : (
            <button
              className="header-btn header-btn--replay"
              onClick={startReplay}
              disabled={timeline.length === 0}
              title={timeline.length === 0 ? "Run some commands first" : "Replay all commands"}
            >
              ▶ Replay
            </button>
          )}
        </div>
      </header>

      {/* ── Replay banner ─────────────────────────────────────────────── */}
      {isReplaying && (
        <div className="replay-banner">
          <span className="replay-dot" />
          Replaying {timeline.length} steps — watch the state panel
        </div>
      )}

      {/* ── Active experiment guide strip ─────────────────────────────── */}
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
                <code className="exp-guide-cmd">
                  {activeExperiment.commands[expStep]}
                </code>
                <button className="exp-run-btn" onClick={runNextStep} disabled={isExecuting}>
                  {isExecuting ? "Running..." : "Run this step →"}
                </button>
              </>
            ) : (
              <span className="exp-guide-done">
                ✓ All steps complete — see reflection below
              </span>
            )}
          </div>
          <div className="exp-guide-progress">
            {activeExperiment.commands.map((_, i) => (
              <div
                key={i}
                className={`exp-progress-dot ${i < expStep ? "exp-progress-dot--done" : i === expStep ? "exp-progress-dot--active" : ""}`}
              />
            ))}
          </div>
          <button className="exp-close-btn" onClick={closeExperiment} title="Exit experiment">✕</button>
        </div>
      )}

      {/* ── Experiment reflection (shown when done) ────────────────────── */}
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

      {/* ── Experiments library ────────────────────────────────────────── */}
      {view === "experiments" && (
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
                <button
                  className="exp-start-btn"
                  onClick={() => startExperiment(exp)}
                >
                  Start Experiment →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Main lab ───────────────────────────────────────────────────── */}
      {view === "lab" && (
        <div className="workspace-body">
          <CommandConsole
            onExecute={handleExecute}
            history={history}
            isLoading={isExecuting}
          />
          <div className="center-column">
            <StateViewer
              state={displayState}
              isLoading={isLoadingState && !isReplaying}
              lastUpdated={lastUpdated}
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