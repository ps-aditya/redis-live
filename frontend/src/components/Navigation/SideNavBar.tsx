// frontend/src/components/Navigation/SideNavBar.tsx

const NAV_ITEMS = [
  { id: 'experiment', icon: 'science',      label: 'Experiments' },
  { id: 'visualizer', icon: 'account_tree', label: 'Visualizer'  },
  { id: 'terminal',   icon: 'terminal',     label: 'Terminal'    },
  { id: 'settings',   icon: 'settings',     label: 'Settings'    },
];

interface SideNavBarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function SideNavBar({ activePage, onNavigate, collapsed, onToggleCollapse }: SideNavBarProps) {
  return (
    <>
      <nav className={`side-nav ${collapsed ? 'side-nav--collapsed' : ''}`}>
        {/* Brand block */}
        <div className="side-nav-brand">
          <div className="side-nav-title">RSE Explorer</div>
          <div className="side-nav-version">v1.0.4-stable</div>
        </div>

        {/* Back to Lab — explicit, separate from the side-nav item group */}
        <div className="side-nav-connect">
          <button className="side-nav-connect-btn" onClick={() => onNavigate('lab')}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Back to Lab
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
          <a
            className="side-nav-footer-item"
            href="__REPO_URL__/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help</span>
            <span>Support</span>
          </a>
        </div>
      </nav>

      {/* Collapse/expand toggle — always visible, sits at the sidebar's edge */}
      <button
        className={`side-nav-toggle ${collapsed ? 'side-nav-toggle--collapsed' : ''}`}
        onClick={onToggleCollapse}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
          {collapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>
    </>
  );
}