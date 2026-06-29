# Redis Live

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
