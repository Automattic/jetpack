import { onlineManager } from '@tanstack/react-query';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { GlobalErrorProvider, useGlobalError } from '../global-error-context';
import { globalErrorManager, type GlobalErrorType } from '../global-error-manager';
import type { Meta, StoryObj } from '@storybook/react';

type GlobalErrorProviderDemoProps = {
	initialGlobalError: GlobalErrorType;
	isOnline: boolean;
};

const ERROR_TYPES: Exclude< GlobalErrorType, null >[] = [ 'network', 'auth', 'server' ];

const panelStyle: CSSProperties = {
	border: '1px solid var(--wpds-color-stroke-surface-neutral-weak, #dcdcde)',
	borderRadius: '8px',
	color: 'var(--wpds-color-fg-content-neutral, #1e1e1e)',
	display: 'grid',
	gap: '16px',
	maxWidth: '520px',
	padding: '16px',
};

const rowStyle: CSSProperties = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: '8px',
};

const valueStyle: CSSProperties = {
	background: 'var(--wpds-color-bg-surface-neutral, #f6f7f7)',
	borderRadius: '4px',
	fontFamily: 'Menlo, Consolas, monospace',
	fontSize: '12px',
	margin: 0,
	padding: '12px',
	whiteSpace: 'pre-wrap',
};

function buttonStyle( active = false ): CSSProperties {
	return {
		background: active
			? 'var(--wpds-color-fg-interactive-brand, #3858e9)'
			: 'var(--wpds-color-bg-surface-neutral-strong, #fff)',
		border: '1px solid var(--wpds-color-stroke-interactive-neutral, #8c8f94)',
		borderRadius: '4px',
		color: active ? '#fff' : 'var(--wpds-color-fg-content-neutral, #1e1e1e)',
		cursor: 'pointer',
		fontSize: '13px',
		fontWeight: 500,
		lineHeight: '20px',
		padding: '6px 10px',
	};
}

function ProviderState() {
	const { globalError, setGlobalError, clearGlobalError, isGlobalError } = useGlobalError();
	const [ isOnline, setIsOnline ] = useState( onlineManager.isOnline() );

	const setOnlineState = useCallback( ( nextIsOnline: boolean ) => {
		onlineManager.setOnline( nextIsOnline );
		setIsOnline( nextIsOnline );
	}, [] );
	const setNetworkError = useCallback( () => setGlobalError( 'network' ), [ setGlobalError ] );
	const setAuthError = useCallback( () => setGlobalError( 'auth' ), [ setGlobalError ] );
	const setServerError = useCallback( () => setGlobalError( 'server' ), [ setGlobalError ] );
	const setOffline = useCallback( () => setOnlineState( false ), [ setOnlineState ] );
	const setOnline = useCallback( () => setOnlineState( true ), [ setOnlineState ] );

	return (
		<div style={ panelStyle }>
			<pre style={ valueStyle }>
				{ JSON.stringify(
					{
						globalError,
						isGlobalError,
						onlineManager: isOnline ? 'online' : 'offline',
					},
					null,
					2
				) }
			</pre>

			<div style={ rowStyle }>
				<button
					type="button"
					style={ buttonStyle( globalError === 'network' ) }
					onClick={ setNetworkError }
				>
					network
				</button>
				<button
					type="button"
					style={ buttonStyle( globalError === 'auth' ) }
					onClick={ setAuthError }
				>
					auth
				</button>
				<button
					type="button"
					style={ buttonStyle( globalError === 'server' ) }
					onClick={ setServerError }
				>
					server
				</button>
				<button type="button" style={ buttonStyle( ! globalError ) } onClick={ clearGlobalError }>
					clear
				</button>
			</div>

			<div style={ rowStyle }>
				<button type="button" style={ buttonStyle( ! isOnline ) } onClick={ setOffline }>
					offline
				</button>
				<button type="button" style={ buttonStyle( isOnline ) } onClick={ setOnline }>
					online
				</button>
			</div>
		</div>
	);
}

function GlobalErrorProviderDemo( { initialGlobalError, isOnline }: GlobalErrorProviderDemoProps ) {
	useEffect( () => {
		onlineManager.setOnline( isOnline );
		if ( initialGlobalError ) {
			globalErrorManager.setError( initialGlobalError );
		} else if ( isOnline ) {
			globalErrorManager.clearError();
		}

		return () => {
			onlineManager.setOnline( true );
			globalErrorManager.clearError();
		};
	}, [ initialGlobalError, isOnline ] );

	return (
		<GlobalErrorProvider>
			<ProviderState />
		</GlobalErrorProvider>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Data/Providers/GlobalErrorProvider',
	component: GlobalErrorProviderDemo,
	tags: [ 'autodocs' ],
	argTypes: {
		initialGlobalError: {
			control: 'select',
			options: [ null, ...ERROR_TYPES ],
		},
		isOnline: {
			control: 'boolean',
		},
	},
	args: {
		initialGlobalError: null,
		isOnline: true,
	},
} satisfies Meta< typeof GlobalErrorProviderDemo >;

export default meta;

type Story = StoryObj< typeof meta >;

export const Clear: Story = {};

export const Offline: Story = {
	args: {
		isOnline: false,
	},
};

export const AuthError: Story = {
	args: {
		initialGlobalError: 'auth',
	},
};

export const ServerError: Story = {
	args: {
		initialGlobalError: 'server',
	},
};
