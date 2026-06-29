import * as vscode from 'vscode';
import { CommandBridge } from './CommandBridge';
import { RedisKey, computeDiff, sortKeysByName } from '../utils/diffEngine';
import { StateUpdateMessage, ConnectionStatusMessage, createMessage } from '../types';

export type ConnectionState = 'connecting' | 'connected' | 'offline' | 'paused';

type SnapshotState = {
	keys: RedisKey[];
	truncated: boolean;
	totalKeyCount: number;
	displayedKeyCount?: number;
};

/**
 * Manages Redis state polling with connection state machine
 * Implements Phase 2 reliability rules (state machine, coalescing, backoff, diffs)
 */
export class StatePoller {
	private state: ConnectionState = 'connecting';
	private pollInterval: number = 1000;
	private pollTimer: NodeJS.Timeout | null = null;
	private retryCount: number = 0;
	private lastRefreshTimestamp: number = 0;
	private generationId: number = 0;
	private isVisible: boolean = false;
	private latestSnapshot: SnapshotState | null = null;
	private previousSnapshot: SnapshotState | null = null;
	private pendingRequest: boolean = false;
	private messageCallback: ((message: any) => void) | null = null;
    private timelineBuffer: any[] = [];
    private lastCommandText: string | null = null;
    private filterPattern: string = '';

    private readonly BACKOFF_INITIAL_MS = 2000;
    private readonly TIMELINE_BUFFER_SIZE = 20;
	private readonly BACKOFF_MAX_MS = 30000;
	private readonly COALESCE_WINDOW_MS = 500;
	private readonly MAX_STATE_PAYLOAD_BYTES = 5242880; // 5 MB
	private readonly MAX_KEYS_IN_PANEL = 1000;

	constructor(
			private commandBridge: CommandBridge,
			private statusCallback: (status: ConnectionState, keyCount?: number) => void
	) {
			const config = vscode.workspace.getConfiguration('redis-state-explorer');
			this.pollInterval = config.get<number>('pollInterval', 1000);
	}

	/**
	 * Set the message callback for sending updates to webview
	 */
	setMessageCallback(callback: (message: any) => void) {
		this.messageCallback = callback;
	}

	/**
	 * Start polling (called when sidebar becomes visible)
	 */
	start() {
		if (this.pollTimer) {
			return; // Already started
		}

		this.state = 'connecting';
		this.statusCallback('connecting');
		this.emitConnectionStatus();
		this.isVisible = true;
		this.retryCount = 0;

		// Delay first poll to allow connection to establish
		this.pollTimer = setTimeout(() => {
			this.pollTimer = null;
			this.poll();
		}, 800);
	}

	/**
	 * Stop polling (called on extension deactivate)
	 */
	stop() {
		if (this.pollTimer) {
			clearTimeout(this.pollTimer);
			this.pollTimer = null;
		}
		this.state = 'offline';
	}

	/**
	 * Pause polling (webview hidden)
	 */
	pause() {
		this.isVisible = false;
		if (this.state === 'connected') {
			this.state = 'paused';
			this.emitConnectionStatus();
		}
		if (this.pollTimer) {
			clearTimeout(this.pollTimer);
			this.pollTimer = null;
		}
	}

	/**
	 * Resume polling (webview visible again)
	 */
	resume() {
		this.isVisible = true;
		if (this.state === 'paused') {
			this.state = 'connecting';
			this.emitConnectionStatus();
			this.poll();
		}
	}

	/**
         * Set key filter pattern (Phase 9.1)
         */
        setFilterPattern(pattern: string) {
                this.filterPattern = pattern;
                this.triggerImmediateRefresh();
        }

        /**
         * Set the last command text for timeline labeling (F4.1)
         */
        setLastCommand(command: string) {
                this.lastCommandText = command;
        }

        /**
         * Trigger save-diff: capture before/after snapshots around a file save (F6.1)
         */
        async triggerSaveDiff(filename: string) {
                const SAVE_DIFF_WINDOW_MS = 1500;

                const snapshotBefore = this.getLatestSnapshot();
                if (!snapshotBefore) return;

                await new Promise(resolve => setTimeout(resolve, SAVE_DIFF_WINDOW_MS));

                let snapshotAfter = await this.fetchImmediatelyAndFreeze();
                const isStale = !snapshotAfter || snapshotAfter === snapshotBefore;

                if (isStale) {
                        this.messageCallback?.({
                                type: 'saveDiff',
                                version: 1,
                                timestamp: Date.now(),
                                data: {
                                        diff: { added: [], modified: [], deleted: [] },
                                        filename: filename.split(/[\\/]/).pop() || filename,
                                        isStale: true,
                                        staleDurationMs: SAVE_DIFF_WINDOW_MS,
                                },
                        });
                        return;
                }

                const diff = computeDiff(snapshotBefore.keys, snapshotAfter?.keys ?? []);
                const hasChanges = diff.added.length > 0 || diff.modified.length > 0 || diff.deleted.length > 0;

                if (hasChanges) {
                        // Add to timeline as save-diff entry (F4.1)
                        const entry = {
                                id: `tl-save-${Date.now()}`,
                                timestamp: Date.now(),
                                sourceType: 'save-diff' as const,
                                diff,
                                keyCountBefore: snapshotBefore.keys.length,
                                keyCountAfter: snapshotAfter.keys.length,
                        };
                        if (this.timelineBuffer.length >= this.TIMELINE_BUFFER_SIZE) {
                                this.timelineBuffer.shift();
                        }
                        this.timelineBuffer.push(entry);

                        this.messageCallback?.({
                                type: 'saveDiff',
                                version: 1,
                                timestamp: Date.now(),
                                data: {
                                        diff,
                                        filename: filename.split(/[\\/]/).pop() || filename,
                                        isStale: false,
                                },
                        });
                }
        }

        /**
         * Get timeline buffer (for webview on reconnect)
         */
        getTimeline() {
                return [...this.timelineBuffer];
        }

        /**
         * Trigger immediate refresh with coalescing (F2.1a rules)
         */
	triggerImmediateRefresh() {
		const now = Date.now();
		const timeSinceLastRefresh = now - this.lastRefreshTimestamp;

		// Rule 1: If fetching in progress, queue and keep only latest
		if (this.pendingRequest) {
			// Already fetching; will retry after coalesce window
			return;
		}

		// Rule 2: Skip if within coalesce window
		if (timeSinceLastRefresh < this.COALESCE_WINDOW_MS) {
			return;
		}

		// Rule 3 & 4: Schedule immediate fetch
		if (this.pollTimer) {
			clearTimeout(this.pollTimer);
			this.pollTimer = null;
		}

		this.poll();
	}

	/**
	 * Get frozen copy of latest snapshot (F2.2)
	 */
	getLatestSnapshot() {
		return this.latestSnapshot ? Object.freeze(JSON.parse(JSON.stringify(this.latestSnapshot))) : null;
	}

	/**
	 * Get current generation ID (F2.2)
	 */
	getGenerationId(): number {
		return this.generationId;
	}

	/**
	 * Fetch immediately and freeze (for save-diff)
	 */
	async fetchImmediatelyAndFreeze(): Promise<SnapshotState | null> {
		try {
			const result = await this.fetchSnapshot();
			return Object.freeze(JSON.parse(JSON.stringify(result)));
		} catch {
			return this.getLatestSnapshot();
		}
	}

	private async poll() {
                if (!this.isVisible) {
                        return;
                }

                

                try {
                        this.pendingRequest = true;
                        const snapshot = await this.fetchSnapshot();
			this.pendingRequest = false;

			// Compute diff (F2.1c: TTL-agnostic)
			const diff = this.previousSnapshot
				? computeDiff(this.previousSnapshot.keys, snapshot.keys)
				: { added: snapshot.keys.map(k => k.name), modified: [], deleted: [] };

			this.previousSnapshot = this.latestSnapshot;
			this.latestSnapshot = snapshot;
			this.generationId++;
			this.lastRefreshTimestamp = Date.now();
			this.retryCount = 0;

			if (this.state !== 'connected') {
                                this.state = 'connected';
                                this.emitConnectionStatus();
                        }

                        // F4.1: Emit timeline entry if diff is non-empty
                        const hasChanges = diff.added.length > 0 || diff.modified.length > 0 || diff.deleted.length > 0;
                        if (hasChanges && this.previousSnapshot !== null) {
                                const isFromTerminal = this.lastCommandText !== null;
                                const entry = {
                                        id: `tl-${Date.now()}-${this.generationId}`,
                                        timestamp: Date.now(),
                                        command: isFromTerminal ? this.lastCommandText! : undefined,
                                        sourceType: isFromTerminal ? 'terminal' : 'poll',
                                        diff,
                                        keyCountBefore: this.previousSnapshot.keys.length,
                                        keyCountAfter: snapshot.keys.length,
                                };
                                this.lastCommandText = null;

                                // F4.3: Rolling circular buffer
                                let isOldestDiscarded = false;
                                if (this.timelineBuffer.length >= this.TIMELINE_BUFFER_SIZE) {
                                        this.timelineBuffer.shift();
                                        isOldestDiscarded = true;
                                }
                                this.timelineBuffer.push(entry);

                                this.messageCallback?.({
                                        type: 'timelineEntry',
                                        version: 1,
                                        timestamp: Date.now(),
                                        data: { ...entry, isOldestDiscarded },
                                });
                        }

                        // Send stateUpdate message to webview

			// Send stateUpdate message to webview
			const stateUpdateMessage = createMessage<StateUpdateMessage>('stateUpdate', {
				state: {
					keys: snapshot.keys,
					truncated: snapshot.truncated,
					totalKeyCount: snapshot.totalKeyCount,
					displayedKeyCount: snapshot.displayedKeyCount,
				},
				diff,
				generationId: this.generationId,
			});

			this.messageCallback?.(stateUpdateMessage);

			// Extract key count for status bar
			const keyCount = snapshot.keys.length;
			this.statusCallback('connected', keyCount);

			// Schedule next poll
			this.schedulePoll();
			} catch (error) {
					this.pendingRequest = false;
					const msg = String(error);
					if (!msg.includes('Not connected')) {
							console.error('StatePoller error:', error);
					}
					this.handleError(error);
					this.scheduleRetry();
			}
	}

	private async fetchSnapshot(): Promise<SnapshotState> {
		if (!this.commandBridge.isConnected()) {
			throw new Error('Not connected to Redis');
		}

		const stateObj = await this.commandBridge.fetchState(this.filterPattern || undefined);
		
		let keys: RedisKey[] = Object.entries(stateObj).map(([name, info]) => ({
			name,
			type: info.type as any,
			value: info.value,
			ttl: info.ttl,
		}));

		keys = sortKeysByName(keys);

		const payloadBytes = JSON.stringify(keys).length;
		if (payloadBytes > this.MAX_STATE_PAYLOAD_BYTES) {
			keys = keys.slice(0, this.MAX_KEYS_IN_PANEL);
			return { keys, truncated: true, totalKeyCount: Object.keys(stateObj).length, displayedKeyCount: keys.length };
		}

		return { keys, truncated: false, totalKeyCount: keys.length };
	}

	private handleError(error: any) {
		const wasConnected = this.state === 'connected';
		this.state = 'offline';
		this.statusCallback('offline');
		this.retryCount++;

		if (wasConnected) {
			this.emitConnectionStatus();
		}

		console.error('StatePoller error:', error);
	}

	private schedulePoll() {
		if (this.pollTimer) {
			clearTimeout(this.pollTimer);
		}

		this.pollTimer = setTimeout(() => {
			this.poll();
		}, this.pollInterval);
	}

	private scheduleRetry() {
		if (this.pollTimer) {
			clearTimeout(this.pollTimer);
		}

		const backoffMs = Math.min(
			this.BACKOFF_INITIAL_MS * Math.pow(2, this.retryCount),
			this.BACKOFF_MAX_MS
		);

		this.pollTimer = setTimeout(() => {
			this.poll();
		}, backoffMs);
	}

	private emitConnectionStatus() {
		if (!this.messageCallback) {
			return;
		}

		const message = createMessage<ConnectionStatusMessage>('connectionStatus', {
			status: this.state,
		});

		this.messageCallback(message);
	}

}
