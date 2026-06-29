import * as vscode from 'vscode';

export type ConnectionProfile = {
    id: string;
    name: string;
    url: string; // redis://[:password@]host[:port][/db] or rediss://
};

const PROFILES_KEY = 'redis-live.profiles';
const RECENT_KEY = 'redis-live.recentConnections';
const ACTIVE_KEY = 'redis-live.activeProfileId';
const MAX_RECENT = 5;

export class ConnectionManager {
    constructor(private context: vscode.ExtensionContext) {}

    // ── Profiles ─────────────────────────────────────────────────────────────

    getProfiles(): ConnectionProfile[] {
        return this.context.globalState.get<ConnectionProfile[]>(PROFILES_KEY, []);
    }

    async saveProfile(profile: ConnectionProfile): Promise<void> {
        const profiles = this.getProfiles().filter(p => p.id !== profile.id);
        profiles.push(profile);
        await this.context.globalState.update(PROFILES_KEY, profiles);
    }

    async deleteProfile(id: string): Promise<void> {
        const profiles = this.getProfiles().filter(p => p.id !== id);
        await this.context.globalState.update(PROFILES_KEY, profiles);
    }

    getActiveProfile(): ConnectionProfile | null {
        const id = this.context.globalState.get<string>(ACTIVE_KEY);
        if (!id) return null;
        return this.getProfiles().find(p => p.id === id) ?? null;
    }

    async setActiveProfile(id: string): Promise<void> {
        await this.context.globalState.update(ACTIVE_KEY, id);
    }

    // ── Recent connections ────────────────────────────────────────────────────

    getRecentUrls(): string[] {
        return this.context.globalState.get<string[]>(RECENT_KEY, []);
    }

    async addRecentUrl(url: string): Promise<void> {
        const recent = this.getRecentUrls().filter(u => u !== url);
        recent.unshift(url);
        await this.context.globalState.update(RECENT_KEY, recent.slice(0, MAX_RECENT));
    }

    // ── Quick pick UI ─────────────────────────────────────────────────────────

    /**
     * Show a quickpick to select or add a connection.
     * Returns the selected URL or null if cancelled.
     */
    async promptConnect(): Promise<ConnectionProfile | null> {
        const profiles = this.getProfiles();
        const recentUrls = this.getRecentUrls();
        const activeId = this.getActiveProfile()?.id;

        type Item = vscode.QuickPickItem & { profile?: ConnectionProfile; url?: string; isAdd?: boolean };

        const items: Item[] = [];

        // Named profiles
        if (profiles.length > 0) {
            items.push({ label: 'Named Connections', kind: vscode.QuickPickItemKind.Separator });
            profiles.forEach(p => {
                items.push({
                    label: (p.id === activeId ? '● ' : '○ ') + p.name,
                    description: p.url,
                    profile: p,
                });
            });
        }

        // Recent URLs not already in profiles
        const profileUrls = new Set(profiles.map(p => p.url));
        const recentNotSaved = recentUrls.filter(u => !profileUrls.has(u));
        if (recentNotSaved.length > 0) {
            items.push({ label: 'Recent', kind: vscode.QuickPickItemKind.Separator });
            recentNotSaved.forEach(u => {
                items.push({ label: u, url: u });
            });
        }

        // Add new
        items.push({ label: '', kind: vscode.QuickPickItemKind.Separator });
        items.push({ label: '$(add) Add new connection…', isAdd: true });

        const picked = await vscode.window.showQuickPick(items, {
            title: 'Redis Live — Connect',
            placeHolder: 'Select a connection or add a new one',
        });

        if (!picked) return null;

        if (picked.isAdd) {
            return this.promptAddConnection();
        }

        if (picked.profile) {
            return picked.profile;
        }

        if (picked.url) {
            // Return an ad-hoc profile from recent URL
            return { id: 'adhoc', name: picked.url, url: picked.url };
        }

        return null;
    }

    /**
     * Show input boxes to create a new named connection profile.
     * Returns the new profile or null if cancelled.
     */
    async promptAddConnection(): Promise<ConnectionProfile | null> {
        const url = await vscode.window.showInputBox({
            title: 'Redis Connection URL',
            prompt: 'Enter Redis URL',
            placeHolder: 'redis://localhost:6379 or rediss://user:pass@host:6380/0',
            validateInput: v => {
                if (!v) return 'URL is required';
                if (!v.startsWith('redis://') && !v.startsWith('rediss://')) {
                    return 'URL must start with redis:// or rediss://';
                }
                return null;
            },
        });

        if (!url) return null;

        const name = await vscode.window.showInputBox({
            title: 'Connection Name',
            prompt: 'Give this connection a name',
            placeHolder: 'e.g. local, staging, prod',
            value: this._inferName(url),
        });

        if (!name) return null;

        const profile: ConnectionProfile = {
            id: Date.now().toString(),
            name,
            url,
        };

        await this.saveProfile(profile);
        await this.addRecentUrl(url);
        return profile;
    }

    private _inferName(url: string): string {
        try {
            const u = new URL(url);
            if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return 'local';
            return u.hostname.split('.')[0];
        } catch {
            return 'Redis';
        }
    }
}