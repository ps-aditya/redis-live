// frontend/src/api/redisApi.ts

const BASE = "http://localhost:3000";

export interface ExecuteResult {
  success: boolean;
  command?: string;
  key?: string;
  value?: string | null;
  deleted?: number;
  exists?: boolean;
  error?: string;
}

export interface StateResult {
  success: boolean;
  state: Record<string, string>;
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