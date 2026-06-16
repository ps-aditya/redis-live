// frontend/src/utils/parseCommand.ts

export type ParsedCommand =
  | { command: "SET";      key: string; value: string }
  | { command: "GET";      key: string }
  | { command: "DEL";      key: string }
  | { command: "EXISTS";   key: string }
  | { command: "EXPIRE";   key: string; value: string }
  | { command: "LPUSH";    key: string; value: string }
  | { command: "RPOP";     key: string }
  | { command: "LPOP";     key: string }
  | { command: "LLEN";     key: string }
  | { command: "HSET";     key: string; field: string; value: string }
  | { command: "HGET";     key: string; field: string }
  | { command: "SADD";     key: string; value: string }
  | { command: "SREM";     key: string; value: string }
  | { command: "FLUSHALL" }
  | { error: string };

export function parseCommand(raw: string): ParsedCommand {
  const parts = raw.trim().split(/\s+/);
  const cmd = parts[0]?.toUpperCase();

  if (!cmd) return { error: "Empty command" };

  if (cmd === "FLUSHALL") {
    return { command: "FLUSHALL" };
  }

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

  if (cmd === "LPOP") {
    if (parts.length < 2) return { error: "Usage: LPOP <key>" };
    return { command: "LPOP", key: parts[1] };
  }

  if (cmd === "LLEN") {
    if (parts.length < 2) return { error: "Usage: LLEN <key>" };
    return { command: "LLEN", key: parts[1] };
  }

  if (cmd === "HSET") {
    if (parts.length < 4) return { error: "Usage: HSET <key> <field> <value>" };
    return { command: "HSET", key: parts[1], field: parts[2], value: parts.slice(3).join(" ") };
  }

  if (cmd === "HGET") {
    if (parts.length < 3) return { error: "Usage: HGET <key> <field>" };
    return { command: "HGET", key: parts[1], field: parts[2] };
  }

  if (cmd === "SADD") {
    if (parts.length < 3) return { error: "Usage: SADD <key> <value>" };
    return { command: "SADD", key: parts[1], value: parts.slice(2).join(" ") };
  }

  if (cmd === "SREM") {
    if (parts.length < 3) return { error: "Usage: SREM <key> <value>" };
    return { command: "SREM", key: parts[1], value: parts.slice(2).join(" ") };
  }

  return {
    error: `Unknown command: ${cmd}. Supported: SET, GET, DEL, EXISTS, EXPIRE, LPUSH, RPOP, LPOP, LLEN, HSET, HGET, SADD, SREM, FLUSHALL`,
  };
}