import * as vscode from 'vscode';
import { CommandBridge } from '../services/CommandBridge';
import { StatePoller } from '../services/StatePoller';
import { ConnectionManager } from '../services/ConnectionManager';

export class TerminalProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'redis-state-explorer.terminal';

    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _commandBridge: CommandBridge,
        private readonly _statePoller: StatePoller,
        private readonly _connectionManager: ConnectionManager,
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'media', 'terminal-webview-dist'),
                this._extensionUri,
            ],
        };

        webviewView.webview.html = this._getHtmlContent(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'ready': {
                        const activeProfile = this._connectionManager.getActiveProfile();
                        this._view!.webview.postMessage({
                            type: 'config',
                            apiUrl: activeProfile?.url ?? 'redis://localhost:6379',
                            pollInterval: 1000,
                            enabled: true,
                        });
                        break;
                    }
                    case 'executeCommand': {
                        const { id, command } = message;
                        const result = await this._commandBridge.executeCommand(command);
                        this._view!.webview.postMessage({
                            type: 'commandResponse',
                            id,
                            command,
                            status: result.status,
                            result: result.result,
                            error: result.error,
                            executionTimeMs: result.executionTimeMs,
                        });
                        if (result.status === 'success') {
                            this._statePoller.triggerImmediateRefresh();
                        }
                        break;
                    }
                    default:
                        console.warn('Unknown message from terminal webview', message);
                }
            },
            undefined,
            [],
        );
    }

    private _getHtmlContent(webview: vscode.Webview): string {
        const nonce = getNonce();
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'terminal-webview-dist', 'terminal.js')
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
    <title>Redis Live Terminal</title>
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
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}