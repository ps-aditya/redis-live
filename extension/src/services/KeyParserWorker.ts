/**
 * KeyParserWorker — Phase 5.2
 * Queues parse requests with monotonic IDs and discards stale results.
 */

import { parseKeysFromText, KeyReference } from './KeyParser';

export class KeyParserWorker {
    private currentRequestId: number = 0;
    private lastCompletedId: number = -1;
    private debounceTimer: NodeJS.Timeout | null = null;
    private readonly DEBOUNCE_MS = 300;

    private onResult: (keys: KeyReference[], requestId: number) => void;

    constructor(onResult: (keys: KeyReference[], requestId: number) => void) {
        this.onResult = onResult;
    }

    /**
     * Queue a parse request. Debounces rapid calls (F5.2).
     */
    requestParse(text: string, filename: string) {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.runParse(text, filename);
        }, this.DEBOUNCE_MS);
    }

    /**
     * Clear highlights (e.g. when switching to a file with no Redis code).
     */
    clearHighlights() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.currentRequestId++;
        this.onResult([], this.currentRequestId);
    }

    private runParse(text: string, filename: string) {
        // F5.2: Monotonic request ID
        const requestId = ++this.currentRequestId;

        // Parse synchronously (files are small; no need for worker thread)
        const keys = parseKeysFromText(text, filename);

        // F5.2: Discard if a newer request has since been issued
        if (requestId <= this.lastCompletedId) {
            return;
        }

        this.lastCompletedId = requestId;
        this.onResult(keys, requestId);
    }

    dispose() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
    }
}
