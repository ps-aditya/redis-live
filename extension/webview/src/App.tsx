import { useEffect, useState } from 'react';

interface VsCodeApi {
	postMessage(message: any): void;
	getState(): any;
	setState(state: any): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

export function App() {
	const [config, setConfig] = useState<{ apiUrl: string; pollInterval: number; enabled: boolean } | null>(null);
	const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
	const [errorMessage, setErrorMessage] = useState<string>('');

	useEffect(() => {
		let isMounted = true;
		const vscode = acquireVsCodeApi();

		// Listen for messages from extension
		const messageHandler = (event: MessageEvent) => {
			const message = event.data;

			if (!isMounted) return;

			if (message.type === 'config') {
				setConfig(message.data);
				setStatus('connected');
			} else if (message.type === 'connectionError') {
				setStatus('error');
				setErrorMessage(message.data.message);
			}
		};

		window.addEventListener('message', messageHandler);

		// Send ready message (Phase 1.1 step 1)
		vscode.postMessage({
			type: 'ready',
			version: 1,
			timestamp: Date.now(),
			data: {
				webviewId: 'sidebar-' + Date.now(),
			},
		});

		return () => {
			isMounted = false;
			window.removeEventListener('message', messageHandler);
		};
	}, []);

	if (status === 'connecting') {
		return (
			<div style={{ padding: '16px', textAlign: 'center' }}>
				<p style={{ color: 'var(--vscode-descriptionForeground)' }}>Connecting to Redis State Explorer...</p>
			</div>
		);
	}

	if (status === 'error') {
		return (
			<div
				style={{
					padding: '12px',
					backgroundColor: 'var(--vscode-inputValidation-errorBackground)',
					border: '1px solid var(--vscode-inputValidation-errorBorder)',
					color: 'var(--vscode-inputValidation-errorForeground)',
					borderRadius: '4px',
					margin: '8px',
				}}
			>
				<strong>Connection Error</strong>
				<p>{errorMessage}</p>
			</div>
		);
	}

	return (
		<div style={{ padding: '12px' }}>
			<div
				style={{
					padding: '12px',
					backgroundColor: 'var(--vscode-editor-selectionBackground)',
					border: '1px solid var(--vscode-editor-selectionHighlightBorder)',
					borderRadius: '4px',
					marginBottom: '12px',
				}}
			>
				<p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>✓ Connected to Redis State Explorer</p>
				{config && (
					<>
						<p style={{ margin: '4px 0', fontSize: '12px' }}>
							<strong>API URL:</strong> {config.apiUrl}
						</p>
						<p style={{ margin: '4px 0', fontSize: '12px' }}>
							<strong>Poll Interval:</strong> {config.pollInterval}ms
						</p>
					</>
				)}
			</div>

			<div style={{ fontSize: '12px', color: 'var(--vscode-descriptionForeground)' }}>
				<p>Phase 1 Proof of Concept</p>
				<p>Live state panel coming in Phase 2</p>
			</div>
		</div>
	);
}
