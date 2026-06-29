import * as vscode from 'vscode';
import * as fs from 'fs';
import { StatePoller } from '../services/StatePoller';
import { CommandBridge } from '../services/CommandBridge';
import { createMessage, ConfigMessage, VSCodeMessage } from '../types';

export class SidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'redis-state-explorer.sidebar';
    public view?: vscode.WebviewView;

    constructor(    
        private readonly extensionUri: vscode.Uri,
        private readonly statePoller: StatePoller,
        private readonly commandBridge: CommandBridge,
        private readonly connectionManager?: any
    ) {}

    async resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, 'media', 'terminal-webview-dist'),
            ],
        };

        webviewView.webview.html = this._getHtmlContent(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(
            (message: any) => this._handleMessage(message, webviewView.webview),
            undefined
        );

        this.statePoller.setMessageCallback((message: any) => {
            webviewView.webview.postMessage(message);
        });

        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this.statePoller.resume();
                this._sendConfig(webviewView.webview);
            } else {
                this.statePoller.pause();
            }
        });

        if (webviewView.visible) {
            this.statePoller.start();
        }
    }

    sendHighlightKeys(keys: { name: string; filename: string; line: number; command: string }[]) {
        if (this.view) {
            this.view.webview.postMessage({
                type: 'highlightKeys',
                version: 1,
                timestamp: Date.now(),
                data: { keys },
            });
        }
    }

    private async _handleMessage(message: VSCodeMessage, webview: vscode.Webview) {
        switch (message.type) {
            case 'ready':
                this._sendConfig(webview);
                this._sendCommandReference(webview);
                this._sendProfiles(webview);  // ADD THIS
                break;
                
            case 'executeCommand': {
                const { id, command } = message as any;
                try {
                    const start = Date.now();
                    const result = await this.commandBridge.executeCommand(command);
                    const executionTimeMs = Date.now() - start;
                    webview.postMessage({
                        type: 'commandResponse',
                        id,
                        command,
                        status: result.status,
                        result: result.result,
                        error: result.error,
                        executionTimeMs,
                    });
                    if (result.status === 'success') {
                        this.statePoller.setLastCommand(command);
                        this.statePoller.triggerImmediateRefresh();
                    }
                } catch (err: any) {
                    webview.postMessage({
                        type: 'commandResponse',
                        id,
                        command,
                        status: 'error',
                        error: err.message ?? String(err),
                        executionTimeMs: 0,
                    });
                }
                break;
            }

            case 'deleteKey': {
                const msg = message as any;
                const keyName = msg.data?.keyName ?? msg.keyName;
                const id = msg.data?.id ?? msg.id;
                const result = await this.commandBridge.deleteKey(keyName);
                this.statePoller.triggerImmediateRefresh();
                webview.postMessage(
                    createMessage('deleteKeyResponse', { id, status: result.status, error: result.error })
                );
                break;
            }

            case 'setFilter':
                this.statePoller.setFilterPattern((message as any).data?.pattern ?? '');
                break;

            case 'selectDb': {
                const db = (message as any).data?.db ?? 0;
                try {
                    await this.commandBridge.selectDb(db);
                    this.statePoller.triggerImmediateRefresh();
                    webview.postMessage({ type: 'dbSelected', data: { db } });
                } catch (e) {
                    console.warn('DB select failed:', e);
                }
                break;
            }

            case 'pausePolling':
                this.statePoller.pause();
                break;

            case 'resumePolling':
                this.statePoller.resume();
                break;

            case 'jumpToCode': {
                const { filename, line } = (message as any).data ?? {};
                if (filename) {
                    try {
                        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filename));
                        const editor = await vscode.window.showTextDocument(doc);
                        const ln = Math.max(0, (line ?? 1) - 1);
                        const range = new vscode.Range(ln, 0, ln, 0);
                        editor.selection = new vscode.Selection(range.start, range.end);
                        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                    } catch (e) {
                        vscode.window.showErrorMessage(`Cannot open file: ${String(e)}`);
                    }
                }
                break;
            }
        }
    }

    private _sendConfig(webview: vscode.Webview) {
        const config = vscode.workspace.getConfiguration('redis-state-explorer');
        webview.postMessage(
            createMessage<ConfigMessage>('config', {
                apiUrl: config.get('apiUrl', 'http://localhost:3000'),
                pollInterval: config.get('pollInterval', 1000),
                enabled: config.get('enabled', true),
            })
        );
    }

    private _sendCommandReference(webview: vscode.Webview) {
        try {
            const refPath = vscode.Uri.joinPath(this.extensionUri, 'media', 'redis-command-reference.json').fsPath;
            const refData = JSON.parse(fs.readFileSync(refPath, 'utf-8'));
            webview.postMessage({ type: 'commandReference', data: refData });
        } catch (e) {
            console.warn('Could not load command reference:', e);
        }
    }
    private _sendProfiles(webview: vscode.Webview) {
        if (!this.connectionManager) return;
        const profiles = this.connectionManager.getProfiles();
        const activeId = this.connectionManager.getActiveProfile()?.id ?? null;
        webview.postMessage({
            type: 'profiles',
            data: { profiles, activeId },
        });
    }

    private _getHtmlContent(webview: vscode.Webview): string {
        const nonce = getNonce();
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, 'media', 'terminal-webview-dist', 'terminal.js')
        );
        const csp = [
            `default-src 'none'`,
            `script-src 'nonce-${nonce}'`,
            `style-src 'unsafe-inline' ${webview.cspSource}`,
            `img-src 'self' data:`,
            `font-src ${webview.cspSource} data:`,
        ].join('; ');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="${csp}">
    <title>Redis Live</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #root { width: 100%; height: 100%; overflow: hidden; }
        body { background: var(--vscode-editor-background); }
    </style>
</head>
<body>
    <div id="root"></div>
    <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

function getNonce(): string {
    let text = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) text += chars.charAt(Math.floor(Math.random() * chars.length));
    return text;
}
