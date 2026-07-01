# Redis Live

**See exactly what your code does to Redis, without leaving VS Code.**

Redis Live is a VS Code extension that connects directly to your Redis instance and shows you what's happening inside it in real time. Run a command, watch the key appear. Save a file, see which keys changed as a result. Every mutation tracked, every change visible, all inside the sidebar.

Built in 2026. Actively maintained.

![Redis Live demo](./media/demo.gif)

---

## Getting Started

Install Redis Live from the banner above or search for it in the Extensions sidebar.

If Redis is running locally, the extension connects automatically on startup — nothing to configure. For cloud instances (Upstash, Redis Cloud, Railway), press `Ctrl+Shift+P` → `Redis Live: Add Connection` and paste your `rediss://` URL.

**No local Redis?** Get a free instance at [Upstash](https://upstash.com) in under 2 minutes and paste the URL. Works immediately over TLS.

**No backend server required.** Redis Live connects directly to Redis using `ioredis`, built into the extension.

---

## The terminal

Type any Redis command directly in the sidebar. All 200+ commands are supported — SET, GET, HSET, ZADD, XADD, SCAN, everything. Commands are syntax-highlighted as you type, with distinct colors for keywords, keys, values, numbers, and flags.

Press `⌨` to open the command reference — a searchable list of every Redis command, organized by category. Click any command to insert it into the input with your cursor positioned at the first argument.

Arrow keys navigate your command history. Tab fills the input from history without committing, so you can use previous commands as templates.

---

## The state panel

Below the terminal, a live view of every key in your Redis instance. Keys update automatically — no manual refresh, no polling indicator to dismiss. When a key is added it flashes green. When it's modified it flashes yellow.

Click any key to expand it and see its full value inline — strings, lists, hashes, sets, sorted sets, and streams all rendered natively in their own format. Type a glob pattern to filter the list instantly (`user:*`, `session:*`, `cache:*`).

---

## The diff timeline

Every change to your Redis state is recorded in a timeline. Commands you ran yourself are labeled with the command text. Changes made by other processes — your application running in another terminal, a background job, a colleague on the same instance — show up as external changes. You always know what changed, when, and what caused it.

---

## Save-diff

This is the feature that makes Redis Live different from every other Redis tool.

When you save a file, Redis Live captures a snapshot of your Redis state before and after. The diff timeline shows exactly which keys changed as a result of that save. If your code sets three keys and updates two others, you'll see all five appear in the timeline the moment you hit save.

No other Redis extension connects your code saves to your Redis state changes.

---

## Code detective

Open any source file that uses a Redis client — Node.js (`client.get()`, `redis.set()`), Python (`r.get()`, `redis.set()`) — and Redis Live scans it for key references. Matching keys in your state panel are highlighted with a blue indicator. Click `⟨/⟩` on any highlighted key to jump directly to the line in your code that references it.

---

## Multiple connections and TLS

Save named connection profiles (local, staging, prod) and switch between them from the command palette. Supports `redis://` for local instances and `rediss://` for TLS-encrypted cloud instances.

---

## Requirements

- VS Code 1.85.0 or later
- A Redis instance — local, Docker, or cloud

---

## License

MIT# Redis Live

**Live Redis state updates in under 1 second. See exactly what your code changed, in real time.**

Terminal, key explorer, diff timeline, and code detective in one sidebar panel. Supports TLS, multiple connections, and all Redis data types. No backend server required.

> **No local Redis?** Get a free instance at [Upstash](https://upstash.com) in 2 minutes and paste the URL. Works immediately.

---

## Why Redis Live?

Every other Redis extension for VS Code was built between 2018 and 2021 and has been abandoned since. They show you keys. They don't show you *what changed*.

Redis Live is built for the workflow that actually matters: **you write code, you run it, and you need to see what it did to Redis, without leaving VS Code.**

---

## Features

### ⚡ Live state panel
All your Redis keys, updating automatically in real time. Keys flash green when added, yellow when modified. No manual refresh. No browser tab. Just your keys, right there.

### 🖥 Terminal with syntax highlighting
Type any Redis command directly in the sidebar. All 200+ commands supported. Commands are color-coded as you type - keywords, keys, values, numbers, and flags each get their own color.

```
❯ SET session:abc "user:john" EX 3600
"OK"
12ms

❯ HSET cart:john items "product:1001" total 89.99
2
8ms
```

### 📊 Diff timeline
Every Redis state change is recorded. Commands you ran are labeled by name. Changes from other processes show as "external change." See exactly what changed, when, and how many keys were affected.

### 💾 Save-diff - the feature nobody else has
Save a file → Redis Live captures your Redis state before and after → shows exactly which keys your code changed as a result. No other tool on earth connects your code saves to your Redis state changes. This is the feature that makes Redis Live irreplaceable once you've used it.

### 🔍 Code detective
Open any file using a Redis client and Redis Live highlights the matching keys in your state panel. Click `⟨/⟩` to jump to the exact line in your code that references that key.

Supports:
- Node.js - `client.get()`, `redis.set()`, `ioredis`
- Python - `r.get()`, `redis.set()`

### 📖 Command reference
Press `⌨` in the terminal to open a searchable reference of 200+ Redis commands organized by category. Click any command to insert it into the terminal input with your cursor at the first argument.

### 🔗 Multiple connections with TLS
Save named connection profiles (local, staging, prod). Switch between them from the sidebar. Supports `redis://` for local and `rediss://` for TLS-encrypted cloud instances.

### 🔎 Key filtering
Type any pattern in the state panel to filter your keys instantly - `user:*`, `session:*`, `cache:*`. Client-side, zero latency.

---

## Getting started

### Zero-config local setup

If Redis is running locally, Redis Live connects automatically on startup. Nothing to configure.

```
redis://localhost:6379
```

### With Docker

```bash
docker run -d -p 6379:6379 redis
```

Open VS Code - Redis Live connects immediately.

### With a cloud instance (no local install needed)

1. Sign up free at [Upstash](https://upstash.com) or [Redis Cloud](https://redis.io/try-free)
2. Copy your connection URL
3. Press `Ctrl+Shift+P` → `Redis Live: Add Connection`
4. Paste your `rediss://` URL

Done. Takes under 2 minutes.

---

## Connection URL format

```
redis://[:password@]host[:port][/database]
rediss://[:password@]host[:port][/database]   ← TLS (cloud instances)
```

**Examples:**
```
redis://localhost:6379
redis://:mypassword@localhost:6379/0
rediss://default:token@my-instance.upstash.io:6380
```

---

## Commands

| Command | What it does |
|---|---|
| `Redis Live: Connect…` | Connect to Redis or switch between saved profiles |
| `Redis Live: Add Connection…` | Save a new named connection profile |
| `Redis Live: Open Panel` | Open the Redis Live sidebar |
| `Redis Live: Configure` | Open extension settings |

---

## Supported data types

| Type | What you see |
|---|---|
| String | Full value, inline |
| List | Item count + all items |
| Hash | Field count + all field→value pairs |
| Set | Member count + all members |
| Sorted Set | Member count + score→member pairs |
| Stream | Entry count + entry IDs and field-value pairs |

---

## Settings

| Setting | Default | Description |
|---|---|---|
| `redis-state-explorer.redisUrl` | `redis://localhost:6379` | Default Redis connection URL |
| `redis-state-explorer.pollInterval` | `1000` | How often to refresh state (ms) |
| `redis-state-explorer.enabled` | `true` | Enable or disable the extension |

---

## Perfect for

- **Debugging** Redis-connected Node.js, Python, and Go applications
- **Learning** Redis data structures - run a command, watch the state change instantly
- **Understanding** what your code actually does to Redis, without guessing
- **Teams** who want to see Redis state during code review or pair programming
- **Students** studying NoSQL databases who want a live feedback loop

---

## Requirements

- VS Code 1.85.0 or later
- A running Redis instance - local, Docker, or cloud

**No backend server required.** Redis Live connects directly to Redis using the battle-tested `ioredis` client, built into the extension. Nothing to install, nothing to run.

---

## Why not the others?

| | Redis Live | Competitors |
|---|---|---|
| Live state updates | ✅ Under 1 second | ❌ Manual refresh only |
| Diff timeline | ✅ Every change recorded | ❌ Not available |
| Save-diff | ✅ Code → Redis causality | ❌ Not available |
| Terminal | ✅ All 200+ commands, highlighted | ❌ Partial or none |
| TLS / cloud Redis | ✅ `rediss://` built in | ⚠️ 2 of 9 competitors |
| Last updated | ✅ 2026 | ❌ 2018–2021, abandoned |

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for full release history.

---

## License

MIT
