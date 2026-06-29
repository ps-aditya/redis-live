import * as vscode from 'vscode';
import { SidebarProvider } from './providers/SidebarProvider';
import { StatePoller } from './services/StatePoller';
import { CommandBridge } from './services/CommandBridge';
import { ConnectionManager } from './services/ConnectionManager';
import { KeyParserWorker } from './services/KeyParserWorker';
import { KeyReference } from './services/KeyParser';

let statusBarItem: vscode.StatusBarItem;
let statePoller: StatePoller | null = null;
let commandBridge: CommandBridge | null = null;
let sidebarProvider: SidebarProvider | null = null;
let connectionManager: ConnectionManager | null = null;

export async function activate(context: vscode.ExtensionContext) {
	await vscode.commands.executeCommand('setContext', 'redis-live:connected', false);

	const config = vscode.workspace.getConfiguration('redis-state-explorer');
	const enabled = config.get<boolean>('enabled', true);

	if (!enabled) {
		return;
	}

	// Create status bar item
	statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBarItem.command = 'redis-state-explorer.openPanel';
	statusBarItem.text = '$(database) Redis Live — connecting…';
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	// Initialize services
	connectionManager = new ConnectionManager(context);
	commandBridge = new CommandBridge((status) => {
		if (status === 'offline') updateStatusBar('offline');
		if (status === 'connected') updateStatusBar('connected', 0);
	});
	statePoller = new StatePoller(commandBridge, updateStatusBar);

// Connect to Redis — non-blocking, StatePoller handles retry
        const redisUrl = config.get<string>('redisUrl', 'redis://localhost:6379');
        lastProfileName = 'local';
        commandBridge.connect(redisUrl).catch(() => {
                updateStatusBar('offline');
        });// Register providers
	sidebarProvider = new SidebarProvider(context.extensionUri, statePoller, commandBridge, connectionManager);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'redis-state-explorer.sidebar',
			sidebarProvider
		)
	);



	// Commands
	context.subscriptions.push(
		vscode.commands.registerCommand('redis-state-explorer.openPanel', () => {
			vscode.commands.executeCommand('workbench.view.extension.redis-state-explorer');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('redis-state-explorer.configure', () => {
			vscode.commands.executeCommand(
				'workbench.action.openSettings',
				'redis-state-explorer'
			);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('redis-live.connect', async () => {
			if (!connectionManager || !commandBridge) return;
			const profile = await connectionManager.promptConnect();
			if (!profile) return;
			await connectionManager.setActiveProfile(profile.id);
			await connectionManager.addRecentUrl(profile.url);
			lastProfileName = profile.name;
			updateStatusBar('connecting');
				commandBridge.connect(profile.url).then(() => {
						lastProfileName = profile.name;
						statePoller?.triggerImmediateRefresh();
						vscode.window.showInformationMessage(`Redis Live: connected to ${profile.name}`);
				}).catch((e: any) => {
						updateStatusBar('offline');
						vscode.window.showErrorMessage(`Redis Live: failed to connect — ${String(e)}`);
				});
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('redis-live.addConnection', async () => {
			if (!connectionManager || !commandBridge) return;
			const profile = await connectionManager.promptAddConnection();
			if (!profile) return;
			await connectionManager.setActiveProfile(profile.id);
			lastProfileName = profile.name;
			updateStatusBar('connecting');
			try {
				await commandBridge.connect(profile.url);
				statePoller?.triggerImmediateRefresh();
				vscode.window.showInformationMessage(`Redis Live: connected to ${profile.name}`);
			} catch (e) {
				updateStatusBar('offline');
				vscode.window.showErrorMessage(`Redis Live: failed to connect — ${String(e)}`);
			}
		})
	);

	// Set context for conditional visibility
	await vscode.commands.executeCommand('setContext', 'redis-state-explorer:enabled', true);

	// Start polling
	if (sidebarProvider.view) {
		statePoller.start();
	}

	// Phase 5: Key parser worker
	const keyParserWorker = new KeyParserWorker((keys: KeyReference[], _requestId: number) => {
		sidebarProvider?.sendHighlightKeys(keys);
	});
	context.subscriptions.push({ dispose: () => keyParserWorker.dispose() });

	if (vscode.window.activeTextEditor) {
		const doc = vscode.window.activeTextEditor.document;
		keyParserWorker.requestParse(doc.getText(), doc.fileName);
	}

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (!editor) {
				keyParserWorker.clearHighlights();
				return;
			}
			keyParserWorker.requestParse(editor.document.getText(), editor.document.fileName);
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(event => {
			if (vscode.window.activeTextEditor?.document === event.document) {
				keyParserWorker.requestParse(event.document.getText(), event.document.fileName);
			}
		})
	);

	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument(doc => {
			statePoller?.triggerSaveDiff(doc.fileName);
		})
	);
}

let statusBarFlashTimer: NodeJS.Timeout | null = null;
let lastKeyCount: number = 0;
let lastProfileName = 'local';

function updateStatusBar(status: 'connecting' | 'connected' | 'offline' | 'paused', keyCount?: number) {
	switch (status) {
		case 'connecting':
			statusBarItem.text = '$(circle-outline) Redis Live — connecting…';
			statusBarItem.color = new vscode.ThemeColor('statusBarItem.warningForeground');
			statusBarItem.backgroundColor = undefined;
			break;

		case 'connected': {
			const count = keyCount ?? lastKeyCount;
			const changed = count !== lastKeyCount && lastKeyCount !== 0;
			lastKeyCount = count;
			statusBarItem.text = `$(circle-filled) ${lastProfileName} — ${count} key${count !== 1 ? 's' : ''}`;
			statusBarItem.color = undefined;
			statusBarItem.backgroundColor = undefined;
			vscode.commands.executeCommand('setContext', 'redis-live:connected', true);
			if (changed) {
				statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
				if (statusBarFlashTimer) clearTimeout(statusBarFlashTimer);
				statusBarFlashTimer = setTimeout(() => {
					statusBarItem.backgroundColor = undefined;
				}, 800);
			}
			break;
		}

		case 'offline':
			statusBarItem.text = '$(circle-slash) Redis Live — offline';
			statusBarItem.color = new vscode.ThemeColor('statusBarItem.errorForeground');
			statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
			vscode.commands.executeCommand('setContext', 'redis-live:connected', false);
			break;

		case 'paused':
			statusBarItem.text = `$(circle-filled) ${lastProfileName} — ${lastKeyCount} key${lastKeyCount !== 1 ? 's' : ''} (paused)`;
			statusBarItem.color = new vscode.ThemeColor('statusBarItem.warningForeground');
			statusBarItem.backgroundColor = undefined;
			break;
	}
}

export function deactivate() {
	if (statePoller) {
		statePoller.stop();
	}
}