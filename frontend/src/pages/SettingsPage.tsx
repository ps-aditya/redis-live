// frontend/src/pages/SettingsPage.tsx

interface SettingsPageProps {
  sandbox: string;
  onSandboxChange: (val: string) => void;
  onFlushAll: () => void;
}

export function SettingsPage({ sandbox, onSandboxChange, onFlushAll }: SettingsPageProps) {
  return (
    <div className="settings-page">
      <div className="settings-page-header">
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#DC143C' }}>settings</span>
        <span className="settings-page-title">Settings</span>
      </div>

      <div className="settings-page-body">

        {/* Connection */}
        <section className="settings-section">
          <h3 className="settings-section-title">Connection</h3>
          <div className="settings-row">
            <span className="settings-row-label">Redis Host</span>
            <span className="settings-row-value">localhost</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Redis Port</span>
            <span className="settings-row-value">6379</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Backend API</span>
            <span className="settings-row-value">http://localhost:3000</span>
          </div>
          <p className="settings-hint">
            Connection settings are currently fixed at build time. Configurable connections are planned for a future release.
          </p>
        </section>

        {/* Sandbox */}
        <section className="settings-section">
          <h3 className="settings-section-title">Sandbox</h3>
          <div className="settings-row">
            <span className="settings-row-label">Active Scenario</span>
            <span className="settings-row-value">{sandbox}</span>
          </div>
          <div className="settings-sandbox-buttons">
            <button className="settings-btn" onClick={() => onSandboxChange('empty')}>Reset to Empty</button>
            <button className="settings-btn" onClick={() => onSandboxChange('ecommerce')}>Load E-Commerce</button>
            <button className="settings-btn" onClick={() => onSandboxChange('chaos')}>Load Chaos</button>
          </div>
          <button className="settings-btn settings-btn--danger" onClick={onFlushAll}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
            FLUSHALL — Clear All Keys
          </button>
        </section>

        {/* Keyboard shortcuts */}
        <section className="settings-section">
          <h3 className="settings-section-title">Keyboard Shortcuts</h3>
          <div className="settings-row">
            <span className="settings-row-label">Run command</span>
            <kbd className="settings-kbd">Enter</kbd>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Previous command</span>
            <kbd className="settings-kbd">↑</kbd>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">Next command</span>
            <kbd className="settings-kbd">↓</kbd>
          </div>
        </section>

        {/* About */}
        <section className="settings-section">
          <h3 className="settings-section-title">About</h3>
          <div className="settings-row">
            <span className="settings-row-label">Version</span>
            <span className="settings-row-value">v1.0.4-stable</span>
          </div>
          <div className="settings-row">
            <span className="settings-row-label">License</span>
            <span className="settings-row-value">MIT</span>
          </div>
          <p className="settings-hint">
            RSE is free and open source. Appearance customization (including a light mode) is planned for a future release.
          </p>
        </section>

      </div>
    </div>
  );
}