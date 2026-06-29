/**
 * Diff computation utility (Phase 2.1c - TTL-agnostic diff)
 * Compares keys using composite identity: (name, type, value)
 * Excludes TTL and encoding from modified detection
 */

export type RedisKey = {
	name: string;
	type: 'string' | 'list' | 'set' | 'zset' | 'hash' | 'stream' | 'unknown';
	value: any;
	ttl: number | null;
	encoding?: string;
	sizeBytes?: number;
};

export type DiffResult = {
	added: string[];
	modified: string[];
	deleted: string[];
};

function createKeyIdentity(key: RedisKey): string {
	// Identity based on: name, type, value (excludes TTL and encoding per F2.1c)
	return JSON.stringify({
		name: key.name,
		type: key.type,
		value: key.value,
	});
}

/**
 * Compute diff between two snapshots (TTL-agnostic)
 * Phase 2.1c: Exclude TTL/encoding from modified decision
 */
export function computeDiff(before: RedisKey[], after: RedisKey[]): DiffResult {
	const beforeMap = new Map(before.map(k => [k.name, k]));
	const afterMap = new Map(after.map(k => [k.name, k]));

	const beforeIdentities = new Map(before.map(k => [k.name, createKeyIdentity(k)]));
	const afterIdentities = new Map(after.map(k => [k.name, createKeyIdentity(k)]));

	const added: string[] = [];
	const modified: string[] = [];
	const deleted: string[] = [];

	// Find added and modified
	for (const [keyName] of afterMap) {
		if (!beforeMap.has(keyName)) {
			added.push(keyName);
		} else {
			const beforeIdentity = beforeIdentities.get(keyName);
			const afterIdentity = afterIdentities.get(keyName);
			if (beforeIdentity !== afterIdentity) {
				modified.push(keyName);
			}
		}
	}

	// Find deleted
	for (const keyName of beforeMap.keys()) {
		if (!afterMap.has(keyName)) {
			deleted.push(keyName);
		}
	}

	return { added, modified, deleted };
}

/**
 * Sort keys lexicographically (Phase 2.1d - Deterministic ordering)
 */
export function sortKeysByName(keys: RedisKey[]): RedisKey[] {
	return [...keys].sort((a, b) => a.name.localeCompare(b.name));
}
