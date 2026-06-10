// frontend/src/components/Navigation/TopNavBar.tsx

interface TopNavBarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  sandbox: string;
  onSandboxChange: (val: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onFlushAll: () => void;
}

export function TopNavBar({
  activePage,
  onNavigate,
  sandbox,
  onSandboxChange,
  searchQuery,
  onSearchChange,
  onFlushAll,
}: TopNavBarProps) {
  const isLanding = activePage === 'landing';

  return (
    <nav className="top-nav">
      {/* Left: Brand */}
      <div className="top-nav-brand">
        <button className="top-nav-logo" onClick={() => onNavigate('landing')}>
          RSE
        </button>
        <div className="top-nav-links">
          <a className="top-nav-link" href="#">Documentation</a>
          <a className="top-nav-link" href="#">GitHub</a>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="top-nav-actions">
        {!isLanding && (
          <>
            {/* Sandbox selector */}
            <div className="top-nav-sandbox">
              <span className="top-nav-label">Sandbox:</span>
              <div className="top-nav-select-wrap">
                <select
                  value={sandbox}
                  onChange={(e) => onSandboxChange(e.target.value)}
                  className="top-nav-select"
                >
                  <option value="empty">Default / Empty</option>
                  <option value="ecommerce">Populated: E-Commerce</option>
                  <option value="chaos">Chaos / Heavy Load</option>
                </select>
                <span className="material-symbols-outlined top-nav-select-icon">expand_more</span>
              </div>
            </div>

            {/* Key search */}
            <div className="top-nav-search">
              <span className="material-symbols-outlined top-nav-search-icon">search</span>
              <input
                type="text"
                placeholder="Search keys..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="top-nav-search-input"
              />
            </div>

            {/* FLUSHALL */}
            <button className="top-nav-btn-danger" onClick={onFlushAll}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
              FLUSHALL
            </button>
          </>
        )}

        {/* Launch Lab / Exit Lab */}
        {isLanding ? (
          <button className="top-nav-btn-primary" onClick={() => onNavigate('lab')}>
            Launch Lab
          </button>
        ) : (
          <button className="top-nav-btn-secondary" onClick={() => onNavigate('landing')}>
            Exit Lab
          </button>
        )}
      </div>
    </nav>
  );
}