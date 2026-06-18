# Architecture

Redis State Explorer is a three-tier web application: a React frontend, an Express backend, and a Redis instance. This document describes the actual system as built.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│                                                                 │
│  React 19 + Vite + TypeScript                                   │
│  ┌───────────┐  ┌────────────────┐  ┌──────────────────────┐    │
│  │  Shell    │  │  LabWorkspace  │  │  VisualizerPage      │    │
│  │  (router) │  │  (3-column)    │  │  (structure canvas)  │    │
│  └───────────┘  └────────────────┘  └──────────────────────┘    │
│                                                                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTP  (localhost:3000)
                        │ POST /execute
                        │ GET  /state
┌───────────────────────▼─────────────────────────────────────────┐
│  Backend                                                        │
│                                                                 │
│  Node.js + Express + TypeScript                                 │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐  │
│  │  POST /execute      │  │  GET /state                      │  │
│  │  Validates command  │  │  Scans all keys, fetches type    │  │
│  │  Runs against Redis │  │  + TTL + value, returns typed    │  │
│  │  Returns result     │  │  RedisEntry[]                    │  │
│  └─────────────────────┘  └──────────────────────────────────┘  │
│                                                                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │ redis://localhost:6379
┌───────────────────────▼─────────────────────────────────────────┐
│  Redis 7                                                        │
│  Stores all keyspace state                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Routing — no React Router

Navigation is managed entirely via `useState` in `Shell.tsx`. There are no URL routes. This was a deliberate decision: preserving state across page switches (terminal scrollback, timeline history, visualizer nodes) without serializing to the URL or a global store.

```
Shell.tsx  (activePage: string)
├── 'landing'    → LandingPage
├── 'lab'        → LabWorkspace
├── 'visualizer' → VisualizerPage
└── 'experiment' → ExperimentPage
```

`useRedisState()` lives in `Shell.tsx` and is passed down as a `redisState` prop. This keeps all live state alive regardless of which page is active.

### State architecture — `useRedisState.ts`

The central hook. All Redis interaction flows through it.

```
useRedisState()
├── currentState: RedisSnapshot          ← live keyspace from GET /state
├── history: string[]                    ← terminal output lines
├── timeline: TimelineEntry[]            ← command history with snapshots
├── latestDiff: DiffResult | null        ← what changed on the last command
├── isReplaying / replayState            ← replay mode
├── handleExecute(raw: string)           ← runs a command end-to-end
│     ├── parseCommand(raw)              ← validate + type the command
│     ├── POST /execute                  ← hit the backend
│     ├── GET /state (via refreshState)  ← fetch updated keyspace
│     ├── computeDiff(before, after)     ← diff the snapshots
│     └── append to history + timeline  ← update UI state
└── refreshState() via setInterval(2000) ← background 2s poll
```

### Diff engine — `diffEngine.ts`

Takes two `RedisSnapshot` objects (before and after a command) and produces a `DiffResult` — a typed list of what was `added`, `deleted`, or `modified`. This drives the mutation flash colors in `StateViewer` (green for new, yellow for modified) and the execution trace step progression in `VisualizerPage`.

```typescript
computeDiff(snapshotBefore, snapshotAfter): DiffResult {
  changes: DiffChange[]  // added | deleted | modified
  hasChanges: boolean
}
```

### Component tree

```
Shell
├── TopNavBar                     (landing + lab pages)
│     ├── RSE logo → navigate('landing')
│     ├── Sandbox dropdown → triggers seeding via Shell useEffect
│     └── FLUSHALL → handleExecute('FLUSHALL')
├── SideNavBar                    (visualizer + experiment pages)
│     └── Explorer / Visualizer / Terminal / Settings nav items
└── shell-page
      ├── LandingPage
      │     └── Typewriter animation, feature cards, pipeline, footer
      ├── LabWorkspace
      │     ├── Lab / Experiments sub-nav tabs
      │     ├── CommandConsole
      │     │     ├── Transparent <input> + syntax-highlighted overlay
      │     │     └── Blinking crimson cursor block
      │     ├── StateViewer          (center, 45%)
      │     │     ├── Redis cards (STRING / LIST / HASH / SET)
      │     │     │     └── TTLBar (smooth 1s interpolation)
      │     │     └── KeyInspector  (accordion, expands on card click)
      │     │           ├── Metadata grid (TTL / encoding / size / fields)
      │     │           ├── Raw value viewer
      │     │           └── Copy Name + Delete Key (DEL)
      │     ├── DiffPanel            (below StateViewer)
      │     │     └── Added / Modified / Deleted rows from latestDiff
      │     └── TimelinePanel        (right, 30%)
      │           ├── Command entries (newest first)
      │           └── Expanded entry: before/after snapshots + diff
      ├── VisualizerPage
      │     ├── Execution trace bar  (driven by timeline.length changes)
      │     │     └── INPUT → INTERPRET → DELTA → VISUALIZE (4-step pulse)
      │     ├── WRONGTYPE banner     (detected from history, dismissible)
      │     └── Structure canvas     (dot-grid background)
      │           ├── StringBlock
      │           ├── ListBlock      (HEAD/TAIL labels, node chain)
      │           ├── HashBlock      (field/value grid, edit-icon on modify)
      │           └── SetBlock       (pill collection)
      └── ExperimentPage
            ├── ExperimentLibrary   (10 cards, difficulty filter)
            └── ExperimentRunner    (for any selected Experiment)
                  ├── Progress bar  + reflection strip on completion
                  ├── Briefing panel (30%)
                  │     ├── Question + Hypothesis
                  │     ├── Useful Commands + How to Break It tabs
                  │     ├── Verification checklist (sequential, lock/unlock)
                  │     └── Production context
                  └── Work area (70%)
                        ├── Sandboxed terminal
                        └── Live viz (currentState keys for this experiment)
```

---

## Backend Architecture

### Endpoints

**`POST /execute`**

Accepts `{ command, key, value? }` from the frontend's `parseCommand` output. Runs the Redis command, handles errors, and returns a typed result object.

Supported commands: `SET`, `GET`, `DEL`, `EXISTS`, `EXPIRE`, `LPUSH`, `RPOP`.

WRONGTYPE errors from Redis are caught and normalized to `{ success: false, error: "WRONGTYPE: ..." }` so the frontend can detect them by string match without needing a separate error code.

**`GET /state`**

Scans all keys with `SCAN`, then for each key fetches:
- `TYPE` → determines which value command to run
- `TTL` → seconds remaining (`-1` = persistent, `-2` = evicted)
- Value: `GET` for strings, `LRANGE 0 -1` for lists, `HGETALL` for hashes, `SMEMBERS` for sets

Returns `Record<string, RedisEntry>` where `RedisEntry` is a discriminated union:

```typescript
type RedisEntry =
  | { type: "string"; value: string;                ttl: number }
  | { type: "list";   value: string[];               ttl: number }
  | { type: "hash";   value: Record<string, string>; ttl: number }
  | { type: "set";    value: string[];               ttl: number }
  | { type: "unknown"; value: null;                  ttl: number }
```

### File structure

```
backend/src/
├── index.ts              # Express app, Redis connection, route mounting
├── redis.ts              # ioredis client singleton (redis://localhost:6379)
├── routes/execute.ts     # Route handlers for /execute and /state
└── services/redisService.ts  # All Redis operations, getFullState()
```

---

## Data Flow — a single command

Tracing `SET user John` from keypress to rendered card:

```
1. User types "SET user John" and presses Enter
2. CommandConsole calls onExecute("SET user John")
3. useRedisState.handleExecute("SET user John")
4. parseCommand("SET user John") → { command: "SET", key: "user", value: "John" }
5. snapshotBefore = { ...snapshotRef.current }
6. POST /execute { command: "SET", key: "user", value: "John" }
7. Backend: redis.set("user", "John") → "OK"
8. Response: { success: true }
9. history line: "SET user John  → OK"
10. GET /state → { user: { type: "string", value: "John", ttl: -1 } }
11. snapshotAfter = { user: { type: "string", value: "John", ttl: -1 } }
12. computeDiff(snapshotBefore, snapshotAfter) → { changes: [{ kind: "added", key: "user", entry: ... }] }
13. latestDiff updated → StateViewer receives pulseMap { "user" → "new" }
14. TimelineEntry appended with command, timestamps, snapshots, diff
15. VisualizerPage sees timeline.length changed → trace sequence fires
16. StateViewer renders "user" STRING card with row-pulse-new (green flash)
```

---

## Key Design Decisions

**No React Router.** Navigation state lives in `Shell.tsx`. The URL never changes. This preserves terminal history, timeline, and visualizer state when switching between pages — a URL-based router would unmount and re-mount these components, losing state.

**No Context API / Redux.** `useRedisState` returns a plain object passed as props. The prop tree is shallow (Shell → 3 page components). Context would add abstraction without solving a real problem at this scale.

**2s polling + 1s client interpolation for TTL.** The backend is polled every 2 seconds for the full keyspace state. TTL display is interpolated client-side at 1-second resolution using the `lastUpdated` timestamp, so countdowns feel smooth without doubling the network traffic.

**Plain CSS over Tailwind.** RSE's design system is bespoke — a systems-brutalist dark theme with a specific tonal layering hierarchy. Plain CSS with class naming conventions (`tok-keyword`, `row-pulse-new`, `exp-check-item--active`) proved more predictable than utility class composition for a design this opinionated.

**Backend normalizes WRONGTYPE errors.** Redis's native WRONGTYPE error message is caught in `routes/execute.ts` and returned as a string starting with `"WRONGTYPE:"`. The frontend detects this by substring match in the latest history line — no error code enum needed, and the message is human-readable in both the terminal and the Visualizer banner.

---

## Performance Characteristics

- React.memo on all card sub-components in StateViewer — only cards whose displayed TTL or value actually changed re-render on each 1s tick
- `useMemo` on `Object.entries(state)` — avoids a new array reference on every render
- Persistent keys (`ttl: -1`) are excluded from TTL interpolation — their props never change, so memo bails out entirely on tick-driven re-renders
- VisualizerPage execution trace timers are cleaned up on unmount via `useEffect` return function
- Sandbox seeding runs commands sequentially to avoid overwhelming the Express single-process backend
