import * as vscode from 'vscode';
import Redis from 'ioredis';

/**
 * CommandBridge — Phase 8
 * Connects directly to Redis via ioredis. No backend required.
 * Supports every Redis command via sendCommand(tokens[]).
 */
export class CommandBridge {
    private client: Redis | null = null;
    private currentUrl: string = '';
    private currentDb: number = 0;
    private onStatusChange?: (status: 'connecting' | 'connected' | 'offline') => void;

    constructor(onStatusChange?: (status: 'connecting' | 'connected' | 'offline') => void) {
        this.onStatusChange = onStatusChange;
    }

    /**
     * Connect to Redis using the configured URL.
     */
    async connect(url?: string): Promise<void> {
        const config = vscode.workspace.getConfiguration('redis-state-explorer');
        const redisUrl = url ?? config.get<string>('redisUrl', 'redis://localhost:6379');

        if (this.client && this.currentUrl === redisUrl && this.client.status === 'ready') {
            return; // Already connected to same URL
        }

        // Save old client so we can restore on failure
        const oldClient = this.client;
        const oldUrl = this.currentUrl;

        this.onStatusChange?.('connecting');

        const newClient = new Redis(redisUrl, {
            lazyConnect: true,
            connectTimeout: 2000,
            maxRetriesPerRequest: 0,
            retryStrategy: () => null,
            enableReadyCheck: false,
        });

// Suppress unhandled error events during connection attempt
        newClient.on('error', () => {});

        try {
            await newClient.connect();

            // Success — disconnect old client and switch
            if (oldClient) {
                oldClient.removeAllListeners();
                await oldClient.quit().catch(() => oldClient.disconnect());
            }

            this.client = newClient;
            this.currentUrl = redisUrl;

            this.client.on('ready', () => {
                this.onStatusChange?.('connected');
            });

            this.client.on('error', (err) => {
                // Suppress unhandled error events — we handle status via onStatusChange
                console.warn('[Redis Live] connection error:', err.message);
                this.onStatusChange?.('offline');
            });

            this.client.on('close', () => {
                this.onStatusChange?.('offline');
            });

            this.onStatusChange?.('connected');

        } catch (err) {
            // Failed — discard new client, restore old connection
            newClient.removeAllListeners();
            await newClient.quit().catch(() => newClient.disconnect());

            this.client = oldClient;
            this.currentUrl = oldUrl;

            // Restore old connection status
            if (oldClient && oldClient.status === 'ready') {
                this.onStatusChange?.('connected');
            } else {
                this.onStatusChange?.('offline');
            }

            throw err;
        }
    }

    /**
     * Disconnect from Redis.
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            this.client.removeAllListeners();
            await this.client.quit().catch(() => this.client?.disconnect());
            this.client = null;
        }
    }

    /**
     * Check if connected.
     */
    isConnected(): boolean {
        return this.client?.status === 'ready';
    }

    /**
     * Switch Redis database (0-15).
     */
    async selectDb(db: number): Promise<void> {
        if (!this.client || this.client.status !== 'ready') {
            throw new Error('Not connected');
        }
        await this.client.select(db);
        this.currentDb = db;
    }

    getCurrentDb(): number {
        return this.currentDb;
    }

    /**
     * Get current Redis URL.
     */
    getUrl(): string {
        return this.currentUrl;
    }

    /**
     * Execute any Redis command from a raw string (e.g. "SET key value").
     * Uses ioredis sendCommand for full protocol support.
     */
    async executeCommand(rawCommand: string): Promise<{
        status: 'success' | 'error';
        result?: any;
        error?: string;
        executionTimeMs: number;
    }> {
        const startTime = Date.now();

        if (!this.client || this.client.status !== 'ready') {
            // Try to connect first
            try {
                await this.connect();
            } catch (e) {
                return { status: 'error', error: 'Not connected to Redis. Check your connection URL in settings.', executionTimeMs: Date.now() - startTime };
            }
        }

        if (!this.client || this.client.status !== 'ready') {
            return { status: 'error', error: 'Not connected to Redis.', executionTimeMs: Date.now() - startTime };
        }

        try {
            const tokens = this._parseTokens(rawCommand);
            if (tokens.length === 0) {
                return { status: 'error', error: 'Empty command.', executionTimeMs: 0 };
            }

            const [cmd, ...args] = tokens;
            // @ts-ignore — ioredis call() accepts any command
            const result = await (this.client as any).call(cmd.toUpperCase(), ...args);
            return { status: 'success', result, executionTimeMs: Date.now() - startTime };
        } catch (error: any) {
            return { status: 'error', error: error.message ?? String(error), executionTimeMs: Date.now() - startTime };
        }
    }

    /**
     * Delete a key directly.
     */
    async deleteKey(keyName: string): Promise<{ status: 'success' | 'error'; error?: string }> {
        const result = await this.executeCommand(`DEL ${keyName}`);
        return { status: result.status, error: result.error };
    }

    /**
     * Fetch all keys and their values/types for the state panel.
     * Uses SCAN to avoid blocking Redis.
     */
    async fetchState(pattern?: string): Promise<Record<string, { type: string; value: any; ttl: number | null }>> {
        if (!this.client || this.client.status !== 'ready') {
            throw new Error('Not connected to Redis');
        }

        const keys: string[] = [];
        let cursor = '0';
        const matchPattern = pattern && pattern.trim() && pattern.trim() !== '*' ? pattern.trim() : undefined;

        // SCAN-based key enumeration (non-blocking)
        do {
            const scanArgs: any[] = [cursor, 'COUNT', 100];
            if (matchPattern) scanArgs.push('MATCH', matchPattern);
            const [nextCursor, batch] = await (this.client as any).scan(...scanArgs);
            cursor = nextCursor;
            keys.push(...batch);
        } while (cursor !== '0');

        const state: Record<string, { type: string; value: any; ttl: number | null }> = {};

        // Fetch type + value + TTL for each key in parallel batches
        const BATCH_SIZE = 20;
        for (let i = 0; i < keys.length; i += BATCH_SIZE) {
            const batch = keys.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async key => {
                try {
                    const type = await this.client!.type(key);
                    const ttl = await this.client!.ttl(key);
                    let value: any = null;

                    switch (type) {
                        case 'string':
                            value = await this.client!.get(key);
                            break;
                        case 'list':
                            value = await this.client!.lrange(key, 0, 99);
                            break;
                        case 'hash':
                            value = await this.client!.hgetall(key);
                            break;
                        case 'set':
                            value = await this.client!.smembers(key);
                            break;
                        case 'zset':
                            value = await this.client!.zrange(key, 0, 99, 'WITHSCORES');
                            break;
                        case 'stream':
                            value = await this.client!.xrange(key, '-', '+', 'COUNT', 20);
                            break;
                        default:
                            value = null;
                    }

                    state[key] = { type, value, ttl: ttl < 0 ? null : ttl };
                } catch {
                    // Key may have expired between SCAN and fetch — skip it
                }
            }));
        }

        return state;
    }

    /**
     * Parse a raw Redis command string into tokens, respecting quoted strings.
     */
    private _parseTokens(raw: string): string[] {
        const parts = raw.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
        return parts.map(p => p.replace(/^["']|["']$/g, ''));
    }
}