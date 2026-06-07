// frontend/src/utils/parseCommand.ts

export type ParsedCommand =
  | { command: "SET";    key: string; value: string }
  | { command: "GET";    key: string }
  | { command: "DEL";    key: string }
  | { command: "EXISTS"; key: string }
  | { command: "EXPIRE"; key: string; value: string }   // value = seconds as string
  | { command: "LPUSH";  key: string; value: string }
  | { command: "RPOP";   key: string }
  | { error: string };

export function parseCommand(raw: string): ParsedCommand {
  const parts = raw.trim().split(/\s+/);
  const cmd = parts[0]?.toUpperCase();

  if (!cmd) return { error: "Empty command" };

  if (cmd === "SET") {
    if (parts.length < 3) return { error: "Usage: SET <key> <value>" };
    return { command: "SET", key: parts[1], value: parts.slice(2).join(" ") };
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

  if (cmd === "EXPIRE") {
    if (parts.length < 3) return { error: "Usage: EXPIRE <key> <seconds>" };
    const seconds = parseInt(parts[2], 10);
    if (isNaN(seconds) || seconds <= 0) return { error: "EXPIRE: seconds must be a positive integer" };
    return { command: "EXPIRE", key: parts[1], value: parts[2] };
  }

  if (cmd === "LPUSH") {
    if (parts.length < 3) return { error: "Usage: LPUSH <key> <value>" };
    return { command: "LPUSH", key: parts[1], value: parts.slice(2).join(" ") };
  }

  if (cmd === "RPOP") {
    if (parts.length < 2) return { error: "Usage: RPOP <key>" };
    return { command: "RPOP", key: parts[1] };
  }

  return {
    error: `Unknown command: ${cmd}. Supported: SET, GET, DEL, EXISTS, EXPIRE, LPUSH, RPOP`,
  };
}