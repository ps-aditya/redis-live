// frontend/src/components/Layout/Shell.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { TopNavBar }      from '../Navigation/TopNavBar';
import { SideNavBar }     from '../Navigation/SideNavBar';
import { LandingPage }    from '../../pages/LandingPage';
import { LabWorkspace }   from '../../pages/LabWorkspace';
import { VisualizerPage } from '../../pages/VisualizerPage';
import { ExperimentPage } from '../../pages/ExperimentPage';
import { useRedisState }  from '../../hooks/useRedisState';
import { TerminalPage } from '../../pages/TerminalPage';
import { SettingsPage } from '../../pages/SettingsPage';
const TOP_NAV_PAGES  = ['landing', 'lab'];
const SIDE_NAV_PAGES = ['visualizer', 'experiment', 'terminal', 'settings'];

// ── Sandbox seed data ─────────────────────────────────────────────────────────

const ECOMMERCE_COMMANDS = [
  // Sessions with TTLs
  'SET session:usr:alice_tok eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  'EXPIRE session:usr:alice_tok 900',
  'SET session:usr:bob_tok eyJzdWIiOiJib2IiLCJpYXQiOjE3MTgzMDB9',
  'EXPIRE session:usr:bob_tok 300',
  // Product catalog as hashes
  'HSET product:1001 name Wireless_Headphones price 89.99 stock 142 category Electronics',
  'HSET product:1002 name Running_Shoes price 129.99 stock 38 category Footwear',
  'HSET product:1003 name Coffee_Maker price 64.99 stock 0 category Kitchen',
  // Shopping cart
  'HSET cart:alice items product:1001,product:1003 total 154.98 updated 1718300000',
  'HSET cart:bob items product:1002 total 129.99 updated 1718300100',
  // Orders queue (FIFO — LPUSH builds queue, RPOP consumes it)
  'LPUSH orders:queue order:8821',
  'LPUSH orders:queue order:8822',
  'LPUSH orders:queue order:8823',
  // Active users set
  'SADD active:users alice',
  'SADD active:users bob',
  'SADD active:users charlie',
  'SADD active:users diana',
  // Cached responses with short TTLs
  'SET cache:homepage CACHED_HTML_PAYLOAD',
  'EXPIRE cache:homepage 60',
  'SET cache:nav CACHED_NAV_PAYLOAD',
  'EXPIRE cache:nav 120',
  // Rate limiting counters
  'SET rate:limit:alice 42',
  'EXPIRE rate:limit:alice 60',
  'SET rate:limit:bob 7',
  'EXPIRE rate:limit:bob 60',
];

// Chaos: 50 keys across 3 namespaces with volatile short TTLs
function buildChaosCommands(): string[] {
  const cmds: string[] = [];
  // 20 tmp: keys (very short TTLs, 5-15s — will expire quickly)
  for (let i = 1; i <= 20; i++) {
    cmds.push(`SET tmp:evt:${i} payload_${Math.random().toString(36).slice(2, 8)}`);
    cmds.push(`EXPIRE tmp:evt:${i} ${5 + Math.floor(i % 11)}`);
  }
  // 15 metric: keys (medium TTLs, 15-30s)
  for (let i = 1; i <= 15; i++) {
    cmds.push(`SET metric:cpu:node${i} ${(40 + Math.random() * 55).toFixed(1)}`);
    cmds.push(`EXPIRE metric:cpu:node${i} ${15 + Math.floor(i % 16)}`);
  }
  // 10 session: keys (longer TTLs, 30-60s)
  for (let i = 1; i <= 10; i++) {
    cmds.push(`SET session:chaos:${i} tok_${Math.random().toString(36).slice(2, 10)}`);
    cmds.push(`EXPIRE session:chaos:${i} ${30 + Math.floor(i % 31)}`);
  }
  // 5 persistent keys (no TTL — intentionally inconsistent)
  for (let i = 1; i <= 5; i++) {
    cmds.push(`SET config:flag:${i} ${i % 2 === 0 ? 'true' : 'false'}`);
  }
  return cmds;
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export function Shell() {
  const [activePage, setActivePage]       = useState('landing');
  const [sandbox, setSandbox]             = useState('empty');
  const [searchQuery, setSearchQuery]     = useState('');
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sideNavCollapsed, setSideNavCollapsed] = useState(false);

  const redisState   = useRedisState();
  const { handleExecute } = redisState;

  const isSeedingRef     = useRef(false);
  const prevSandboxRef   = useRef('empty');

  // ── Real FLUSHALL ──────────────────────────────────────────────────────────
  const handleFlushAll = useCallback(async () => {
    await handleExecute('FLUSHALL');
  }, [handleExecute]);

  // ── Sandbox seeding ────────────────────────────────────────────────────────
  useEffect(() => {
    if (sandbox === prevSandboxRef.current) return;
    prevSandboxRef.current = sandbox;
    if (isSeedingRef.current) return;

    async function seed() {
      isSeedingRef.current = true;
      setSandboxLoading(true);

      try {
        // Always flush first regardless of target sandbox
        await handleExecute('FLUSHALL');

        if (sandbox === 'ecommerce') {
          for (const cmd of ECOMMERCE_COMMANDS) {
            await handleExecute(cmd);
          }
        } else if (sandbox === 'chaos') {
          const cmds = buildChaosCommands();
          for (const cmd of cmds) {
            await handleExecute(cmd);
          }
        }
        // 'empty' case: flush already done above
      } finally {
        setSandboxLoading(false);
        isSeedingRef.current = false;
      }
    }

    seed();
  }, [sandbox, handleExecute]);

  function navigate(page: string) {
    setActivePage(page);
  }

  const useTopNav  = TOP_NAV_PAGES.includes(activePage);
  const useSideNav = SIDE_NAV_PAGES.includes(activePage);

  return (
    <div className="shell">

      {useTopNav && (
        <TopNavBar
          activePage={activePage}
          onNavigate={navigate}
          sandbox={sandbox}
          onSandboxChange={setSandbox}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFlushAll={handleFlushAll}
          sandboxLoading={sandboxLoading}
        />
      )}

      <div className="shell-content">
        {useSideNav && (
          <SideNavBar
            activePage={activePage}
            onNavigate={navigate}
            collapsed={sideNavCollapsed}
            onToggleCollapse={() => setSideNavCollapsed((v) => !v)}
          />
        )}

        <div className="shell-page" key={activePage}>
          {activePage === 'landing'    && <LandingPage onNavigate={navigate} />}
          {activePage === 'lab'        && <LabWorkspace redisState={redisState} sandbox={sandbox} />}
          {activePage === 'visualizer' && <VisualizerPage redisState={redisState} />}
          {activePage === 'experiment' && <ExperimentPage onNavigate={navigate} redisState={redisState} />}
          {activePage === 'terminal' && <TerminalPage redisState={redisState} />}
          {activePage === 'settings' && (
            <SettingsPage
              sandbox={sandbox}
              onSandboxChange={setSandbox}
              onFlushAll={handleFlushAll}
            />
          )}
        </div>
      </div>

    </div>
  );
}