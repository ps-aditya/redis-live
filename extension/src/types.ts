/**
 * Message envelope and types for webview ↔ extension communication
 * Implements Phase 1.2 message versioning contract
 */

export type VSCodeMessage = {
	type: string;
	version: number; // Current: 1
	timestamp: number; // milliseconds since epoch
	id?: string; // For request-response correlation
	data: any;
};

// Webview → Extension messages

export type ReadyMessage = VSCodeMessage & {
	type: 'ready';
	data: {
		webviewId: string;
	};
};

export type ExecuteCommandMessage = VSCodeMessage & {
	type: 'executeCommand';
	data: {
		command: string;
		id: string;
	};
};

export type DeleteKeyMessage = VSCodeMessage & {
	type: 'deleteKey';
	data: {
		keyName: string;
		id: string;
	};
};

export type PausePollingMessage = VSCodeMessage & {
	type: 'pausePolling';
};

export type ResumePollingMessage = VSCodeMessage & {
	type: 'resumePolling';
};

// Extension → Webview messages

export type ConfigMessage = VSCodeMessage & {
	type: 'config';
	data: {
		apiUrl: string;
		pollInterval: number;
		enabled: boolean;
	};
};

export type StateUpdateMessage = VSCodeMessage & {
	type: 'stateUpdate';
	data: {
		state: {
			keys: Array<{
				name: string;
				type: 'string' | 'list' | 'set' | 'zset' | 'hash' | 'stream' | 'unknown';
				value: any;
				ttl: number | null;
				encoding?: string;
				sizeBytes?: number;
			}>;
			truncated: boolean;
			totalKeyCount: number;
			displayedKeyCount?: number;
		};
		diff: {
			added: string[];
			modified: string[];
			deleted: string[];
		};
		generationId: number;
	};
};

export type CommandResponseMessage = VSCodeMessage & {
	type: 'commandResponse';
	data: {
		id: string;
		status: 'success' | 'error';
		result?: any;
		error?: string;
		executionTimeMs: number;
	};
};

export type ConnectionErrorMessage = VSCodeMessage & {
	type: 'connectionError';
	data: {
		message: string;
	};
};

export type ConnectionStatusMessage = VSCodeMessage & {
	type: 'connectionStatus';
	data: {
		status: 'connecting' | 'connected' | 'offline' | 'paused';
	};
};

export type TimelineEntryMessage = VSCodeMessage & {
	type: 'timelineEntry';
	data: {
		id: string;
		timestamp: number;
		command?: string;
		sourceType: 'terminal' | 'poll' | 'save-diff';
		diff: {
			added: string[];
			modified: string[];
			deleted: string[];
		};
		keyCountBefore: number;
		keyCountAfter: number;
		isOldestDiscarded?: boolean;
	};
};

export type HighlightKeysMessage = VSCodeMessage & {
	type: 'highlightKeys';
	data: {
		keys: Array<{
			name: string;
			filename: string;
			line: number;
		}>;
	};
};

export type SaveDiffMessage = VSCodeMessage & {
	type: 'saveDiff';
	data: {
		diff: {
			added: string[];
			modified: string[];
			deleted: string[];
		};
		filename: string;
		isStale?: boolean;
		staleDurationMs?: number;
	};
};

// Helper to create message envelope
export function createMessage<T extends VSCodeMessage>(
	type: T['type'],
	data: T['data'],
	id?: string
): T {
	return {
		type,
		version: 1,
		timestamp: Date.now(),
		id,
		data,
	} as T;
}
