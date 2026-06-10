// frontend/src/components/Navigation/SideNavBar.tsx

const NAV_ITEMS = [
  { id: 'lab',        icon: 'database',     label: 'Explorer'   },
  { id: 'visualizer', icon: 'account_tree', label: 'Visualizer' },
  { id: 'terminal',   icon: 'terminal',     label: 'Terminal'   },
  { id: 'settings',   icon: 'settings',     label: 'Settings'   },
];

interface SideNavBarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export function SideNavBar({ activePage, onNavigate }: SideNavBarProps) {
  return (
    <nav className="side-nav">
      {/* Brand block */}
      <div className="side-nav-brand">
        <div className="side-nav-title">RSE Explorer</div>
        <div className="side-nav-version">v1.0.4-stable</div>
      </div>

      {/* New Connection */}
      <div className="side-nav-connect">
        <button className="side-nav-connect-btn">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          New Connection
        </button>
      </div>

      {/* Nav items */}
      <div className="side-nav-items">
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`side-nav-item ${isActive ? 'side-nav-item--active' : ''}`}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '20px',
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="side-nav-footer">
        <button className="side-nav-footer-item">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help</span>
          <span>Support</span>
        </button>
        <button className="side-nav-footer-item">
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>account_circle</span>
          <span>User profile</span>
        </button>
      </div>
    </nav>
  );
}