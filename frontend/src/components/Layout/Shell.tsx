// frontend/src/components/Layout/Shell.tsx

import { useState } from 'react';
import { TopNavBar }     from '../Navigation/TopNavBar';
import { SideNavBar }    from '../Navigation/SideNavBar';
import { LandingPage }   from '../../pages/LandingPage';
import { LabWorkspace }  from '../../pages/LabWorkspace';
import { VisualizerPage }   from '../../pages/VisualizerPage';
import { ExperimentPage }   from '../../pages/ExperimentPage';
import { useRedisState } from '../../hooks/useRedisState';

// Pages that show the horizontal TopNavBar (no sidebar)
const TOP_NAV_PAGES = ['landing', 'lab'];

// Pages that show the vertical SideNavBar
const SIDE_NAV_PAGES = ['visualizer', 'experiment', 'terminal', 'settings'];

export function Shell() {
  const [activePage, setActivePage]   = useState('landing');
  const [sandbox, setSandbox]         = useState('empty');
  const [searchQuery, setSearchQuery] = useState('');

  // All Redis state lives here — persists when navigating between pages
  const redisState = useRedisState();

  function navigate(page: string) {
    setActivePage(page);
  }

  function handleFlushAll() {
    // Will be wired to real FLUSHALL in Phase 3
    console.log('FLUSHALL triggered from nav');
  }

  const useTopNav  = TOP_NAV_PAGES.includes(activePage);
  const useSideNav = SIDE_NAV_PAGES.includes(activePage);

  return (
    <div className="shell">

      {/* ── Horizontal top nav (Landing + Lab) ── */}
      {useTopNav && (
        <TopNavBar
          activePage={activePage}
          onNavigate={navigate}
          sandbox={sandbox}
          onSandboxChange={setSandbox}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFlushAll={handleFlushAll}
        />
      )}

      {/* ── Content area ── */}
      <div className="shell-content">
        {useSideNav && (
          <SideNavBar activePage={activePage} onNavigate={navigate} />
        )}

        <div className="shell-page">
          {activePage === 'landing'    && <LandingPage onNavigate={navigate} />}
          {activePage === 'lab'        && <LabWorkspace redisState={redisState} sandbox={sandbox} />}
          {activePage === 'visualizer' && <VisualizerPage redisState={redisState} />}
          {activePage === 'experiment' && <ExperimentPage onNavigate={navigate} redisState={redisState} />}
          {(activePage === 'terminal' || activePage === 'settings') && (
            <div className="shell-placeholder">
              <span className="material-symbols-outlined">construction</span>
              <p>{activePage} — coming in Phase 3</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}