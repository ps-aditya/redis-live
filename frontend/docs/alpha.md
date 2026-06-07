# RSE Alpha — Release Definition

## What Alpha means
Alpha is the first version worth showing to someone who isn't you.
It is not feature-complete. It is not polished.
It is *coherent* — a user can arrive, understand what RSE is, and learn something real about Redis.

## Alpha feature checklist

### Core lab
- [ ] Execute Redis commands (SET, GET, DEL, EXISTS, EXPIRE, LPUSH, RPOP)
- [ ] View live keyspace state with type-aware cards (STRING, LIST, HASH, SET)
- [ ] TTL countdown with visual bar — watch keys expire in real time
- [ ] Command history in terminal panel

### Observability
- [ ] State diff after every command (Added / Modified / Deleted)
- [ ] Timeline of all commands with before/after snapshots
- [ ] Click any timeline entry to inspect what changed
- [ ] Replay mode — step through state history

### Experiment system
- [ ] Experiment library with 10 built-in experiments
- [ ] Step-by-step experiment runner (not all-at-once)
- [ ] Hypothesis shown before running
- [ ] Reflection questions shown after completing

### Quality bar
- [ ] No TypeScript errors (`npx tsc --noEmit` passes clean)
- [ ] Works on a fresh Redis instance with zero data
- [ ] All 10 experiments run without errors
- [ ] A first-year CS student can complete one experiment without help

## What Alpha does NOT include
- Authentication / accounts
- Persistent experiment history
- Pub/Sub or Streams visualization
- Landing page
- Deployment

## Definition of done
A user runs the queue experiment from start to finish
and can answer: "Why did RPOP return task1 and not task3?"
without looking at any documentation.