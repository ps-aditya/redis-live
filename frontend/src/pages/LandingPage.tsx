// frontend/src/pages/LandingPage.tsx

import { useState, useEffect } from 'react';

const TAGLINE = '> Observe Redis. Break Redis. Understand Redis.';

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
  { icon: 'terminal',     label: 'Command Input', sub: 'Step Layer', accent: false },
  { icon: 'difference',   label: 'State Delta',   sub: 'Step Layer', accent: false },
  { icon: 'visibility',   label: 'Visualization', sub: 'Step Layer', accent: false },
  { icon: 'check_circle', label: 'Mastery',        sub: 'Validation', accent: true  },
];

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  // Typewriter state
  const [typedText, setTypedText]     = useState('');
  const [typingDone, setTypingDone]   = useState(false);

  // Entrance animation trigger
  const [heroVisible, setHeroVisible] = useState(false);

  // Typewriter: starts after a short delay so the hero h1 can enter first
  useEffect(() => {
    // Trigger hero entrance immediately
    const heroTimer = setTimeout(() => setHeroVisible(true), 50);

    // Start typewriter almost immediately — don't wait for entrance to settle
    let i = 0;
    const typeTimer = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setTypedText(TAGLINE.slice(0, i));
        if (i >= TAGLINE.length) {
          clearInterval(interval);
          setTypingDone(true);
        }
      }, 20); // ~20ms per character = full tagline in ~0.95s
      return () => clearInterval(interval);
    }, 200);

    return () => {
      clearTimeout(heroTimer);
      clearTimeout(typeTimer);
    };
  }, []);

  return (
    <div className="landing">

      {/* Ambient grid */}
      <div className="landing-grid-bg" />

      {/* ── Hero ── */}
      <section className={`landing-hero ${heroVisible ? 'landing-hero--visible' : ''}`}>
        <h1 className="landing-h1 landing-h1--animate">Redis State Explorer</h1>

        <p className="landing-tagline landing-tagline--animate">
          {typedText}
          <span className={`landing-cursor ${typingDone ? 'landing-cursor--blink' : 'landing-cursor--solid'}`}>
            _
          </span>
        </p>

        <div className="landing-ctas landing-ctas--animate">
          <button
            className="landing-btn-primary"
            onClick={() => onNavigate('experiment')}
          >
            Start Learning
          </button>
          <button
            className="landing-btn-secondary"
            onClick={() => onNavigate('lab')}
          >
            Open Lab →
          </button>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="landing-features">
        <div className="landing-features-grid">
          {FEATURE_CARDS.map((card, i) => (
            <div
              key={card.title}
              className="landing-feature-card"
              style={{ animationDelay: `${0.1 + i * 0.12}s` }}
            >
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
            <div key={step.label} className="landing-pipeline-row">
              <div className="landing-pipeline-item">
                <div className={`landing-pipeline-node ${step.accent ? 'landing-pipeline-node--accent' : ''}`}>
                  <span className={`material-symbols-outlined ${step.accent ? 'landing-pipeline-icon--accent' : ''}`}>
                    {step.icon}
                  </span>
                </div>
                <span className={`landing-pipeline-step-label ${step.accent ? 'landing-pipeline-step-label--accent' : ''}`}>
                  {step.label}
                </span>
                <span className="landing-pipeline-step-sub">{step.sub}</span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className="landing-pipeline-arrow" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Author / Contact ── */}
      <section className="landing-author">
        <div className="landing-author-card">
          <div className="landing-author-text">
            <span className="landing-author-label">Built by</span>
            <span className="landing-author-name">Aditya P. S.</span>
            <p className="landing-author-desc">
              RSE is free and open source. Questions, feedback, or ideas for new experiments - reach out.
            </p>
          </div>
          <div className="landing-author-links">
            <a href="https://www.linkedin.com/company/redis-state-explorer" className="landing-author-link" target="_blank" rel="noopener noreferrer">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>link</span>
              LinkedIn
            </a>
            <a href="https://github.com/ps-aditya/redis-state-explorer" className="landing-author-link" target="_blank" rel="noopener noreferrer">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>code</span>
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-links">
          <a href="https://github.com/ps-aditya/redis-state-explorer" className="landing-footer-link">GitHub</a>
          <a href="https://github.com/ps-aditya/redis-state-explorer#readme" className="landing-footer-link">Documentation</a>
          <a href="https://github.com/ps-aditya/redis-state-explorer/blob/main/LICENSE" className="landing-footer-link">License</a>
        </div>
        <div className="landing-footer-tagline">Observe. Break. Understand.</div>
      </footer>

    </div>
  );
}