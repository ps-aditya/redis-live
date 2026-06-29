/**
 * KeyParser — Phase 5.1
 * Extracts Redis key references from source files using explicit client-library patterns only.
 * Never extracts standalone strings — only keys inside recognized Redis client calls.
 */

export type KeyReference = {
    name: string;
    filename: string;
    line: number; // 1-indexed
    command: string; // the Redis command used (e.g. "lpush")
};

// F5.1: Explicit client-library patterns only (Node.js + Python)
const PATTERNS: RegExp[] = [
    // Node.js: client.get("key"), redis.set("key", ...), etc.
    /(?:client|redis)\.(?:get|set|lpush|lpop|rpush|rpop|hset|hget|hmset|hmget|hdel|hexists|hgetall|sadd|srem|smembers|scard|del|exists|expire|ttl|incr|decr|getset|setnx|setex|append|llen|lrange|lindex|lset|lrem|type|persist|rename|copy|unlink)\s*\(\s*['"]([^'"]+)['"]\s*[,)]/gi,
    // Python: r.get("key"), redis.set("key", ...), etc.
    /(?:r|redis)\.(?:get|set|lpush|lpop|rpush|rpop|hset|hget|hmset|hmget|hdel|hexists|hgetall|sadd|srem|smembers|scard|delete|exists|expire|ttl|incr|decr|getset|setnx|setex|append|llen|lrange|lindex|lset|lrem|type|persist|rename|copy)\s*\(\s*['"]([^'"]+)['"]\s*[,)]/gi,
];

/**
 * Parse a source file's text and extract Redis key references.
 * Returns only keys found inside recognized client-library call patterns (F5.1).
 */
export function parseKeysFromText(text: string, filename: string): KeyReference[] {
    const lines = text.split('\n');
    const results: KeyReference[] = [];
    const seen = new Set<string>(); // deduplicate by name+line

    lines.forEach((lineText, lineIndex) => {
        for (const pattern of PATTERNS) {
            pattern.lastIndex = 0; // reset regex state
            let match: RegExpExecArray | null;
            while ((match = pattern.exec(lineText)) !== null) {
                const keyName = match[1];
                // Extract command from the full match (e.g. "client.set" -> "set")
                const fullMatch = match[0];
                const commandMatch = fullMatch.match(/\.([a-z]+)\s*\(/i);
                const command = commandMatch ? commandMatch[1].toLowerCase() : 'unknown';
                const dedupeKey = `${keyName}:${lineIndex + 1}`;
                if (!seen.has(dedupeKey)) {
                    seen.add(dedupeKey);
                    results.push({
                        name: keyName,
                        filename,
                        line: lineIndex + 1,
                        command,
                    });
                }
            }
        }
    });

    return results;
}
