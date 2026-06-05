// frontend/src/utils/parseCommand.ts

export type ParsedCommand =
  | { command: "SET"; key: string; value: string }
  | { command: "GET"; key: string }
  | { command: "DEL"; key: string }
  | { command: "EXISTS"; key: string }
  | { error: string };

export function parseCommand(raw: string): ParsedCommand {
  const parts = raw.trim().split(/\s+/);
  const cmd = parts[0]?.toUpperCase();

  if (!cmd) return { error: "Empty command" };

  if (cmd === "SET") {
    if (parts.length < 3) return { error: "Usage: SET <key> <value>" };
    const key = parts[1];
    const value = parts.slice(2).join(" ");
    return { command: "SET", key, value };
  }

  if (cmd === "GET") {
    if (parts.length < 2) return { error: "Usage: GET <key>" };
    return { command: "GET", key: parts[1] };
  }

  if (cmd === "DEL") {
    if (parts.length < 2) return { error: "Usage: DEL <key>" };
    return { command: "DEL", key: parts[1] };
  }

  if (cmd === "EXISTS") {
    if (parts.length < 2) return { error: "Usage: EXISTS <key>" };
    return { command: "EXISTS", key: parts[1] };
  }

  return { error: `Unknown command: ${cmd}. Supported: SET, GET, DEL, EXISTS` };
}