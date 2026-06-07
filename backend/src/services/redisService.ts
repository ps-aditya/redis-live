// backend/src/services/redisService.ts

import { redisClient } from "../redis";

// ── Shared type ──────────────────────────────────────────────────────────────

export type RedisEntry =
  | { type: "string"; value: string; ttl: number }
  | { type: "list";   value: string[]; ttl: number }
  | { type: "hash";   value: Record<string, string>; ttl: number }
  | { type: "set";    value: string[]; ttl: number }
  | { type: "unknown"; value: null; ttl: number };

// ── Individual command executors ─────────────────────────────────────────────

export async function executeSet(key: string, value: string): Promise<void> {
  await redisClient.set(key, value);
}

export async function executeGet(key: string): Promise<string | null> {
  return await redisClient.get(key);
}

export async function executeDel(key: string): Promise<number> {
  return await redisClient.del(key);
}

export async function executeExists(key: string): Promise<number> {
  return await redisClient.exists(key);
}

export async function executeExpire(key: string, seconds: number): Promise<boolean> {
  const result = await redisClient.expire(key, seconds);
  // redis v4+ returns boolean, older returns 0/1 — handle both
  return typeof result === "boolean" ? result : (result as number) === 1;
}

export async function executeLPush(key: string, value: string): Promise<number> {
  return await redisClient.lPush(key, value);
}

export async function executeRPop(key: string): Promise<string | null> {
  return await redisClient.rPop(key);
}

// ── Full state snapshot ───────────────────────────────────────────────────────

export async function getFullState(): Promise<Record<string, RedisEntry>> {
  const keys = await redisClient.keys("*");
  if (keys.length === 0) return {};

  const state: Record<string, RedisEntry> = {};

  for (const key of keys) {
    const type = await redisClient.type(key);
    const ttl  = await redisClient.ttl(key);
    // ttl: -1 = no expiry (persistent), -2 = key doesn't exist

    if (type === "string") {
      const value = await redisClient.get(key);
      state[key] = { type: "string", value: value ?? "", ttl };

    } else if (type === "list") {
      const value = await redisClient.lRange(key, 0, -1);
      state[key] = { type: "list", value, ttl };

    } else if (type === "hash") {
      const value = await redisClient.hGetAll(key);
      state[key] = { type: "hash", value, ttl };

    } else if (type === "set") {
      const value = await redisClient.sMembers(key);
      state[key] = { type: "set", value, ttl };

    } else {
      state[key] = { type: "unknown", value: null, ttl };
    }
  }

  return state;
}