// frontend/src/data/experiments.ts

import type { Experiment } from "../types";

export const EXPERIMENTS: Experiment[] = [

  // ── Strings ────────────────────────────────────────────────────────────────

  {
    id: "string-overwrite",
    title: "What happens when a key is overwritten?",
    difficulty: "Beginner",
    concepts: ["Strings", "SET"],
    question: "What happens when a key is overwritten?",
    hypothesis: "Setting the same key twice will replace the first value.",
    description:
      "Set a key, then set it again with a different value. Watch whether Redis keeps the old value, appends to it, or replaces it entirely.",
    commands: [
      "SET username alice",
      "SET username bob",
      "GET username",
    ],
    reflection: [
      "Did Redis keep both values or only one?",
      "What does this tell you about how Redis handles duplicate keys?",
      "When would accidentally overwriting a key cause a bug in production?",
    ],
  },

  // ── TTL ────────────────────────────────────────────────────────────────────

  {
    id: "ttl-watch-expiry",
    title: "Can data disappear automatically?",
    difficulty: "Beginner",
    concepts: ["TTL", "EXPIRE", "Expiration"],
    question: "Can data disappear automatically without any code deleting it?",
    hypothesis: "Redis can schedule key deletion using EXPIRE.",
    description:
      "Create a session token and give it a 15-second TTL. Watch the countdown bar drain in real time. When it hits zero, the key evicts itself — no cleanup code required.",
    commands: [
      "SET session:token abc123xyz",
      "EXPIRE session:token 15",
      "GET session:token",
    ],
    reflection: [
      "What happened to the key after the TTL expired?",
      "Why would automatic expiry be useful for session tokens?",
      "What would go wrong if session keys never expired?",
    ],
  },

  // ── Lists as Queue ─────────────────────────────────────────────────────────

  {
    id: "list-as-queue",
    title: "Can Redis behave like a queue?",
    difficulty: "Beginner",
    concepts: ["Lists", "LPUSH", "RPOP", "FIFO"],
    question: "Can Redis Lists implement FIFO (first in, first out) queue behavior?",
    hypothesis: "Pushing to the left and popping from the right produces FIFO order.",
    description:
      "Push three tasks onto a list in order, then pop them off one at a time. Observe which task comes out first and why.",
    commands: [
      "LPUSH jobs task:1",
      "LPUSH jobs task:2",
      "LPUSH jobs task:3",
      "RPOP jobs",
      "RPOP jobs",
    ],
    reflection: [
      "Which task came out first — the first one you pushed or the last?",
      "Why does RPOP from a left-push list produce FIFO order?",
      "A food delivery app needs to process orders in the exact sequence received. How would you implement this with Redis?",
    ],
  },

  // ── Lists as Stack ─────────────────────────────────────────────────────────

  {
    id: "list-as-stack",
    title: "Can Redis behave like a stack?",
    difficulty: "Beginner",
    concepts: ["Lists", "LPUSH", "LPOP", "LIFO"],
    question: "Can Redis Lists implement LIFO (last in, first out) stack behavior?",
    hypothesis: "Pushing and popping from the same side produces LIFO order.",
    description:
      "Push three items onto a list, then pop from the same side. Compare the order to the queue experiment. The direction of pop determines whether you get a queue or a stack.",
    commands: [
      "LPUSH history page:home",
      "LPUSH history page:about",
      "LPUSH history page:contact",
      "LPOP history",
      "LPOP history",
    ],
    reflection: [
      "Which page came out first — the first one you visited or the last?",
      "What is the only difference between this and the queue experiment?",
      "Browser back buttons use a stack. How would you model this with Redis?",
    ],
  },

  // ── Sets: unique membership ────────────────────────────────────────────────

  {
    id: "set-uniqueness",
    title: "Why are duplicates ignored?",
    difficulty: "Beginner",
    concepts: ["Sets", "SADD", "Uniqueness"],
    question: "What happens when you add the same value to a Redis Set twice?",
    hypothesis: "Sets enforce uniqueness — the second add is silently ignored.",
    description:
      "Add the same user ID to a set multiple times. Check how many members the set actually contains. Then add a different user and see the count increase.",
    commands: [
      "SADD active:users uid:101",
      "SADD active:users uid:101",
      "SADD active:users uid:101",
      "SADD active:users uid:102",
    ],
    reflection: [
      "How many members does the set have even though you added uid:101 three times?",
      "A streaming platform counts unique viewers per video. Why is a Set the right data structure here?",
      "What would go wrong if you used a List instead of a Set for this?",
    ],
  },

  // ── Hashes as objects ──────────────────────────────────────────────────────

  {
    id: "hash-as-object",
    title: "How can Redis store objects?",
    difficulty: "Intermediate",
    concepts: ["Hashes", "HSET", "HGET", "Objects"],
    question: "Can Redis store structured data like a user profile without serializing to JSON?",
    hypothesis: "Hashes let you store and retrieve individual fields atomically.",
    description:
      "Create a user profile as a Hash, then read back a single field. Compare this to storing the whole profile as a JSON string in a single key.",
    commands: [
      "HSET user:1001 username alice",
      "HSET user:1001 role admin",
      "HSET user:1001 last_login 1718300000",
      "HGET user:1001 role",
    ],
    reflection: [
      "How did HGET retrieve only the role without reading the entire object?",
      "If 1000 requests per second each read only the email field, which is faster — HGET on a Hash or GET on a JSON string?",
      "What happens if two requests update different fields of the same Hash simultaneously?",
    ],
  },

  // ── WRONGTYPE error ────────────────────────────────────────────────────────

  {
    id: "wrongtype-error",
    title: "Trigger a WRONGTYPE error",
    difficulty: "Beginner",
    concepts: ["Errors", "Type Safety", "WRONGTYPE"],
    question: "What happens when you use the wrong command for a key's type?",
    hypothesis: "Redis will reject the command rather than silently corrupting data.",
    description:
      "Create a string key, then try to use a List command on it. Redis enforces type safety at the command level — it will tell you exactly what went wrong.",
    commands: [
      "SET user:type string_key",
      "LPUSH user:type this_will_fail",
    ],
    reflection: [
      "Did Redis silently overwrite the key or reject the operation?",
      "Why is this the correct behavior rather than allowing the overwrite?",
      "In a production system where multiple services write to Redis, how does this type safety prevent bugs?",
    ],
  },

  // ── Caching pattern ────────────────────────────────────────────────────────

  {
    id: "caching-pattern",
    title: "Why is Redis used for caching?",
    difficulty: "Intermediate",
    concepts: ["Caching", "TTL", "SET", "Patterns"],
    question: "How does a cache-aside pattern work with Redis?",
    hypothesis: "Storing expensive query results in Redis with a TTL reduces repeated computation.",
    description:
      "Simulate a database query result being cached in Redis. Set a TTL to represent how long the cache is valid. When the TTL expires, the next request would re-query the database.",
    commands: [
      "SET cache:user:1001 '{\"name\":\"Alice\",\"role\":\"admin\"}'",
      "EXPIRE cache:user:1001 30",
      "GET cache:user:1001",
    ],
    reflection: [
      "What would happen to the cached value after 30 seconds?",
      "If 10,000 users request the same user profile per second, how does this cache reduce database load?",
      "What is the risk of setting the TTL too long? Too short?",
    ],
  },

  // ── Key overwrite vs DEL ───────────────────────────────────────────────────

  {
    id: "del-vs-overwrite",
    title: "DEL vs overwrite — what is the difference?",
    difficulty: "Intermediate",
    concepts: ["DEL", "SET", "Keyspace"],
    question: "Is DEL different from just overwriting a key with an empty value?",
    hypothesis: "DEL removes the key entirely. SET overwrites the value but keeps the key.",
    description:
      "Create a key, overwrite it with an empty string, then use DEL. Watch what the state panel shows in each case and how the keyspace count changes.",
    commands: [
      "SET config:debug true",
      "SET config:debug ''",
      "DEL config:debug",
    ],
    reflection: [
      "After setting config:debug to empty string, did the key disappear from the state panel?",
      "After DEL, what happened to the key count?",
      "In a feature flag system, when would you use DEL versus setting a value to 'false'?",
    ],
  },

  // ── EXISTS and GET on missing keys ─────────────────────────────────────────

  {
    id: "missing-keys",
    title: "What does Redis return for keys that don't exist?",
    difficulty: "Beginner",
    concepts: ["GET", "EXISTS", "nil", "Null handling"],
    question: "How does Redis signal that a key does not exist?",
    hypothesis: "Redis returns nil (null) for GET and 0 for EXISTS on missing keys.",
    description:
      "Query a key that was never created. Then create it, query it, delete it, and query it again. Watch how Redis signals presence versus absence.",
    commands: [
      "GET ghost:key",
      "EXISTS ghost:key",
      "SET ghost:key found",
      "EXISTS ghost:key",
      "DEL ghost:key",
      "GET ghost:key",
    ],
    reflection: [
      "What did Redis return for GET before the key existed?",
      "What did EXISTS return before and after creating the key?",
      "In application code, how should you handle a nil response from Redis to avoid null pointer errors?",
    ],
  },

];