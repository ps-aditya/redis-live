# Roadmap

This document tracks what has been built, what is in progress, and where RSE is going.

---

## Completed

All seven phases of the initial build plan are complete.

### Phase 1 — Core Lab
- [x] Redis command execution (SET, GET, DEL, EXISTS, EXPIRE, LPUSH, RPOP)
- [x] Live keyspace state panel with 2-second polling
- [x] Command history with syntax highlighting
- [x] State diff — added / modified / deleted on every command
- [x] Command timeline with before/after snapshots
- [x] Timeline replay mode

### Phase 2 — Navigation Shell
- [x] Landing page with hero, feature grid, execution pipeline
- [x] Tab-state routing (Shell) — state persists across page switches
- [x] TopNavBar (horizontal) for Landing + Lab
- [x] SideNavBar (vertical) for Visualizer + Experiment pages
- [x] Sandbox dropdown (Default / E-Commerce / Chaos)
- [x] Four page scaffolds: Landing, Lab, Visualizer, Experiment

### Phase 3 — Terminal Polish
- [x] Syntax-highlighted terminal input (real-time token coloring)
- [x] Syntax-highlighted history output
- [x] Auto-scroll to latest command
- [x] Blinking crimson cursor block

### Phase 4 — Key Inspector
- [x] Mutation flash colors (green = new, yellow = modified)
- [x] Key Inspector accordion — click any card to expand
- [x] Inspector shows TTL, encoding estimate, size estimate, field count
- [x] Raw value viewer inside inspector
- [x] Copy Name + Delete Key (DEL) actions inside inspector
- [x] Smooth 1-second client-side TTL interpolation

### Phase 5 — Structure Visualizer
- [x] Execution trace pipeline driven by real command timeline
- [x] WRONGTYPE error banner — dismissible, re-appears on next error
- [x] Block-level mutation pulses (green/yellow glow on structure blocks)
- [x] List node staggered slide-in animation on change
- [x] Hash row flash + edit icon on field modification

### Phase 6 — Experiment Library
- [x] 10 guided experiments across Strings, Lists, Sets, Hashes, TTL, Errors, Caching
- [x] Library picker with difficulty filter (Beginner / Intermediate / Advanced)
- [x] Generalized step-by-step runner for any experiment
- [x] Sequential verification checklist with lock/unlock logic
- [x] Reflection questions on experiment completion
- [x] Live structure visualizer scoped to experiment keys
- [x] Production context panel per experiment
- [x] Terminal input placeholder shows next expected command

### Phase 7 — Polish + Sandbox + Performance
- [x] Landing page typewriter animation
- [x] Staggered entrance animations (hero, feature cards)
- [x] E-Commerce sandbox — 14 realistic keys (sessions, products, carts, queue, set, cache, rate limits)
- [x] Chaos sandbox — 50 keys with volatile TTLs (5–60s)
- [x] Real FLUSHALL wired to nav button
- [x] Seeding indicator in sandbox dropdown
- [x] React.memo on card sub-components
- [x] useMemo on keyspace entries
- [x] Persistent keys excluded from TTL re-render cycle

---

## Current Milestone — Public Launch

These are the items blocking the first public release.

- [ ] **Production deployment** — Railway / Render / Fly.io with a managed Redis instance
- [ ] **Screenshots** — 6 screenshots for README (landing, lab, inspector, visualizer, experiment library, experiment runner)
- [ ] **Demo GIF** — 35-second recording of core flow (see `docs/assets/MEDIA_GUIDE.md`)
- [ ] **Custom domain** (optional but improves credibility)
- [ ] **GitHub repository polish** — description, topics, social preview image

---

## Next Features

These are confirmed directions, not scheduled.

### Redis Commands
- `HGET` / `HGETALL` / `HDEL` from the terminal (currently HSET-only)
- `SADD` / `SREM` / `SMEMBERS` from the terminal
- `LPOP` / `LLEN` from the terminal
- `KEYS *` / `SCAN` with pattern filtering

### Visualization
- Pub/Sub visualization — publish a message and watch subscribers receive it
- Streams visualization — append entries, read groups, consumer lag
- Eviction policy simulation — set `maxmemory` and watch LRU/LFU behavior
- Persistence visualization — RDB snapshot timing, AOF append behavior

### Experiments
- `INCR` / `DECR` — atomic counters
- Pub/Sub — how messages travel
- Sorted Sets — leaderboard pattern
- Stream as event log — append-only audit trail

### Product
- Shareable experiment URLs — deep-link to a specific experiment
- Dark/light mode toggle
- Keyboard shortcuts in the terminal (↑/↓ for history, Ctrl+L to clear)
- Mobile-responsive layout

---

## Long-Term Vision

Redis State Explorer evolves from a Redis learning tool into a broader systems exploration platform.

The core idea — make opaque systems visible through observation — applies well beyond Redis:

- **Docker** — watch container state, port bindings, and network topology change in real time
- **Linux** — observe process trees, file descriptors, and system calls
- **Networking** — trace packets through a request lifecycle
- **Distributed systems** — visualize consensus, replication lag, partition behavior

The mission remains the same:

> Make infrastructure systems observable, understandable, and approachable through experimentation.
