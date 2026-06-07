// frontend/src/api/redisApi.ts

import type { RedisEntry, RedisSnapshot } from "../types";

const BASE = "http://localhost:3000";

export type { RedisEntry };  // re-export so existing imports don't break

export interface ExecuteResult {
  success: boolean;
  command?: string;
  key?: string;
  value?: string | null;
  deleted?: number;
  exists?: boolean;
  applied?: boolean;
  seconds?: number;
  length?: number;
  error?: string;
}

export interface StateResult {
  success: boolean;
  state: RedisSnapshot;
}

export async function executeCommand(
  command: string,
  key: string,
  value?: string
): Promise<ExecuteResult> {
  const response = await fetch(`${BASE}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, key, value }),
  });
  return response.json();
}

export async function fetchState(): Promise<StateResult> {
  const response = await fetch(`${BASE}/state`);
  return response.json();
}