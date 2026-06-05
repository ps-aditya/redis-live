// backend/src/services/redisService.ts

import { redisClient } from "../redis";

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

export async function getFullState(): Promise<Record<string, string>> {
  const keys = await redisClient.keys("*");

  if (keys.length === 0) return {};

  const state: Record<string, string> = {};

  for (const key of keys) {
    const value = await redisClient.get(key);
    if (value !== null) {
      state[key] = value;
    }
  }

  return state;
}