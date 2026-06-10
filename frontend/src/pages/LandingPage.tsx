// frontend/src/pages/LandingPage.tsx

const FEATURE_CARDS = [
  {
    icon: 'build',
    title: 'Break & Fix Lab',
    desc: 'Safely inject latency, simulate partitions, and monitor how your data structures react under stress in a sandboxed environment.',
  },
  {
    icon: 'timeline',
    title: 'Real-Time State Delta',
    desc: 'Track memory allocations and key mutations byte-by-byte as they happen. Zero ambiguity visual diffs of state changes.',
  },
  {
    icon: 'account_tree',
    title: 'Structural Visualizer',
    desc: 'Inspect complex Hashes, Sets, and Sorted Sets as graphical node structures. Understand deep nesting at a glance.',
  },
];

const PIPELINE_STEPS = [
  { icon: 'terminal',     label: 'Command Input', sub: 'Step Layer',  accent: false },
  { icon: 'difference',   label: 'State Delta',   sub: 'Step Layer',  accent: false },
  { icon: 'visibility',   label: 'Visualization', sub: 'Step Layer',  accent: false },
  { icon: 'check_circle', label: 'Mastery',        sub: 'Validation',  accent: true  },
];

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="landing">

      {/* Ambient grid */}
      <div className="landing-grid-bg" />

      {/* ── Hero ── */}
      <section className="landing-hero">
        <h1 className="landing-h1">Redis State Explorer</h1>
        <p className="landing-tagline">
          &gt; Observe Redis. Break Redis. Understand Redis.<span className="landing-cursor">_</span>
        </p>
        <div className="landing-ctas">
          <button className="landing-btn-primary" onClick={() => onNavigate('lab')}>
            Launch Lab
          </button>
          <button className="landing-btn-secondary">
            View Documentation
          </button>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="landing-features">
        <div className="landing-features-grid">
          {FEATURE_CARDS.map((card) => (
            <div key={card.title} className="landing-feature-card">
              <div className="landing-feature-icon">
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '28px', fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                >
                  {card.icon}
                </span>
              </div>
              <h3 className="landing-feature-title">{card.title}</h3>
              <p className="landing-feature-desc">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pipeline ── */}
      <section className="landing-pipeline">
        <div className="landing-pipeline-label">Execution Pipeline</div>
        <div className="landing-pipeline-steps">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step.label} className="landing-pipeline-item">
              <div className={`landing-pipeline-node ${step.accent ? 'landing-pipeline-node--accent' : ''}`}>
                <span className={`material-symbols-outlined ${step.accent ? 'landing-pipeline-icon--accent' : ''}`}>
                  {step.icon}
                </span>
              </div>
              <span className={`landing-pipeline-step-label ${step.accent ? 'landing-pipeline-step-label--accent' : ''}`}>
                {step.label}
              </span>
              <span className="landing-pipeline-step-sub">{step.sub}</span>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className="landing-pipeline-arrow" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-links">
          <a href="#" className="landing-footer-link">GitHub</a>
          <a href="#" className="landing-footer-link">Documentation</a>
          <a href="#" className="landing-footer-link">License</a>
        </div>
        <div className="landing-footer-tagline">Observe. Break. Understand.</div>
      </footer>

    </div>
  );
}