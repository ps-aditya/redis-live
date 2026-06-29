# Changelog

All notable changes to Redis Live are documented here.

## [0.3.0] — 2026-06-29

### Added
- **Live state panel** — Redis keys update automatically in real time, no manual refresh needed
- **Unified sidebar** — terminal, state panel, diff timeline, and command reference all in one panel
- **Direct ioredis connection** — no backend server required; connects directly to Redis
- **Named connection profiles** — save local, staging, and production connections, switch from the sidebar
- **TLS support** — connect to cloud Redis instances via `rediss://` URL
- **URL connection string input** — paste directly from your `.env` file
- **Save-diff** — captures Redis state before and after file save, shows exactly what your code changed
- **Diff timeline** — rolling 20-entry history of every Redis state change with labeled commands
- **Syntax-highlighted terminal** — color coding for commands, keys, values, numbers, and flags
- **Command history** — Up/Down to cycle history, Tab to copy without committing
- **Command reference sidebar** — searchable 200+ command reference, click to insert into terminal
- **Key filtering** — instant client-side filter by pattern
- **Copy key name** — one click to copy any key name to clipboard
- **Code detective** — highlights Redis keys referenced in open files, jump-to-code support
- **Status bar indicator** — `● local — 15 keys` with flash animation on state change
- **10s command timeout** — clear timeout message if backend is unresponsive
- **Response type rendering** — nil, strings, numbers, arrays, JSON all rendered with appropriate colors

### Technical
- Built on `ioredis` — the battle-tested Node.js Redis client
- SCAN-based key enumeration (non-blocking, production safe)
- Exponential backoff on connection failure
- Snapshot generation tracking with stale update discard
- Phase 1–9 architecture complete

---

## [0.2.0] — 2025-12-01

### Added
- Initial webview-based sidebar
- Basic state polling via HTTP backend
- Terminal command execution

---

## [0.1.0] — 2025-10-15

### Added
- Initial proof of concept
- Message bridge handshake
- Connection state machine
