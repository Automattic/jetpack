import { onlineManager } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { WidgetRoot } from '../../../../widgets-toolkit/src/components/widget-root/widget-root';
import { useWidgetError } from '../../../../widgets-toolkit/src/hooks/use-widget-error';
import { GlobalErrorProvider, useGlobalError } from '../global-error-context';
import { globalErrorManager, type GlobalErrorType } from '../global-error-manager';
import type { WidgetErrorConfig } from '../../../../widgets-toolkit/src/types';
import type { Meta, StoryObj } from '@storybook/react';

type WidgetError = WidgetErrorConfig | true | null;

type GlobalErrorProviderDemoProps = {
	initialGlobalError: GlobalErrorType;
	widgetError: boolean;
};

const ERROR_TYPES: Exclude< GlobalErrorType, null >[] = [ 'network', 'auth', 'server' ];

const pageStyle: CSSProperties = {
	display: 'grid',
	gap: '16px',
	maxWidth: '960px',
	color: 'var(--wpds-color-fg-content-neutral, #1e1e1e)',
};

const sectionStyle: CSSProperties = {
	background: 'var(--wpds-color-bg-surface-neutral-strong, #fff)',
	border: '1px solid var(--wpds-color-stroke-surface-neutral-weak, #e4e4e4)',
	borderRadius: '8px',
	padding: '16px',
};

const gridStyle: CSSProperties = {
	display: 'grid',
	gap: '12px',
	gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
};

const buttonRowStyle: CSSProperties = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: '8px',
};

const mutedTextStyle: CSSProperties = {
	color: 'var(--wpds-color-fg-content-neutral-weak, #646970)',
	fontSize: '13px',
	lineHeight: 1.5,
	margin: 0,
};

const codeStyle: CSSProperties = {
	background: 'var(--wpds-color-bg-surface-neutral, #f6f7f7)',
	border: '1px solid var(--wpds-color-stroke-surface-neutral-weak, #dcdcde)',
	borderRadius: '4px',
	display: 'block',
	fontFamily: 'Menlo, Consolas, monospace',
	fontSize: '12px',
	lineHeight: 1.6,
	margin: 0,
	overflowX: 'auto',
	padding: '12px',
	whiteSpace: 'pre-wrap',
};

const widgetPreviewStyle: CSSProperties = {
	background: 'var(--wpds-color-bg-surface-neutral-strong, #fff)',
	border: '1px solid var(--wpds-color-stroke-surface-neutral-weak, #dcdcde)',
	borderRadius: '8px',
	display: 'grid',
	gap: '12px',
	minHeight: '144px',
	padding: '16px',
};

const buttonStyle = ( isSelected = false ): CSSProperties => ( {
	background: isSelected
		? 'var(--wpds-color-fg-interactive-brand, #3858e9)'
		: 'var(--wpds-color-bg-surface-neutral-strong, #fff)',
	border: '1px solid var(--wpds-color-stroke-interactive-neutral, #8c8f94)',
	borderRadius: '4px',
	color: isSelected ? '#fff' : 'var(--wpds-color-fg-content-neutral, #1e1e1e)',
	cursor: 'pointer',
	fontSize: '13px',
	fontWeight: 500,
	lineHeight: '20px',
	padding: '6px 10px',
} );

function StatusPill( { active, label }: { active: boolean; label: string } ) {
	return (
		<span
			style={ {
				background: active
					? 'var(--wpds-color-bg-surface-success, #edfaef)'
					: 'var(--wpds-color-bg-surface-neutral, #f6f7f7)',
				border: '1px solid var(--wpds-color-stroke-surface-neutral-weak, #dcdcde)',
				borderRadius: '999px',
				color: active
					? 'var(--wpds-color-fg-content-success, #008a20)'
					: 'var(--wpds-color-fg-content-neutral-weak, #646970)',
				display: 'inline-flex',
				fontSize: '12px',
				fontWeight: 600,
				lineHeight: '16px',
				padding: '2px 8px',
			} }
		>
			{ label }
		</span>
	);
}

function WidgetErrorNotice( { error }: { error: WidgetErrorConfig | true } ) {
	const config: Partial< WidgetErrorConfig > = error === true ? {} : error;
	const defaultMessage = __(
		"We couldn't load this data. Please try again in a moment.",
		'jetpack-premium-analytics'
	);
	const message = config.message ?? defaultMessage;

	return (
		<Notice.Root intent="error" spokenMessage={ message || defaultMessage }>
			{ message && <Notice.Description>{ message }</Notice.Description> }
			{ config.action && (
				<Notice.Actions>
					<Notice.ActionButton onClick={ config.action.onClick }>
						{ config.action.label }
					</Notice.ActionButton>
				</Notice.Actions>
			) }
		</Notice.Root>
	);
}

function GlobalErrorButton( {
	errorType,
	isSelected,
	onSelect,
}: {
	errorType: Exclude< GlobalErrorType, null >;
	isSelected: boolean;
	onSelect: ( errorType: Exclude< GlobalErrorType, null > ) => void;
} ) {
	const handleClick = useCallback( () => onSelect( errorType ), [ errorType, onSelect ] );

	return (
		<button type="button" style={ buttonStyle( isSelected ) } onClick={ handleClick }>
			{ errorType }
		</button>
	);
}

function OnlineManagerButton( {
	isSelected,
	isOnline,
	label,
	onSelect,
}: {
	isSelected: boolean;
	isOnline: boolean;
	label: string;
	onSelect: ( isOnline: boolean ) => void;
} ) {
	const handleClick = useCallback( () => onSelect( isOnline ), [ isOnline, onSelect ] );

	return (
		<button type="button" style={ buttonStyle( isSelected ) } onClick={ handleClick }>
			{ label }
		</button>
	);
}

function ProviderStatePanel() {
	const { globalError, setGlobalError, clearGlobalError, isGlobalError } = useGlobalError();
	const [ isOnline, setIsOnline ] = useState( onlineManager.isOnline() );

	const setOnlineState = useCallback( ( nextIsOnline: boolean ) => {
		onlineManager.setOnline( nextIsOnline );
		setIsOnline( nextIsOnline );
	}, [] );

	return (
		<div style={ sectionStyle }>
			<div style={ { display: 'flex', justifyContent: 'space-between', gap: '12px' } }>
				<div>
					<h3 style={ { fontSize: '16px', lineHeight: '24px', margin: '0 0 4px' } }>
						Provider state
					</h3>
					<p style={ mutedTextStyle }>
						State is read through <code>useGlobalError()</code> and written through the provider
						context or the shared manager.
					</p>
				</div>
				<StatusPill active={ isGlobalError } label={ isGlobalError ? 'global error' : 'clear' } />
			</div>

			<div style={ { ...gridStyle, marginBlockStart: '16px' } }>
				<div>
					<p style={ mutedTextStyle }>Current global error</p>
					<pre style={ codeStyle }>
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
				</div>

				<div>
					<p style={ { ...mutedTextStyle, marginBlockEnd: '8px' } }>Context controls</p>
					<div style={ buttonRowStyle }>
						{ ERROR_TYPES.map( errorType => (
							<GlobalErrorButton
								key={ errorType }
								errorType={ errorType }
								isSelected={ globalError === errorType }
								onSelect={ setGlobalError }
							/>
						) ) }
						<button
							type="button"
							style={ buttonStyle( ! globalError ) }
							onClick={ clearGlobalError }
						>
							clear
						</button>
					</div>

					<p style={ { ...mutedTextStyle, marginBlock: '16px 8px' } }>Online manager</p>
					<div style={ buttonRowStyle }>
						<OnlineManagerButton
							isOnline={ false }
							isSelected={ ! isOnline }
							label="set offline"
							onSelect={ setOnlineState }
						/>
						<OnlineManagerButton
							isOnline
							isSelected={ isOnline }
							label="set online"
							onSelect={ setOnlineState }
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

function WidgetErrorProbe( { isError, onRefetch }: { isError: boolean; onRefetch: () => void } ) {
	const error = useMemo( () => new Error( 'Storybook report request failed.' ), [] );
	const hasError = useWidgetError( isError, error, onRefetch );

	if ( hasError ) {
		return null;
	}

	return (
		<div
			style={ {
				alignItems: 'center',
				background: 'var(--wpds-color-bg-surface-success, #edfaef)',
				border: '1px solid var(--wpds-color-stroke-surface-success-strong, #4ab866)',
				borderRadius: '4px',
				display: 'flex',
				minHeight: '72px',
				padding: '12px',
			} }
		>
			Widget content rendered without reporting an error.
		</div>
	);
}

function WidgetErrorPreview( { error, retryCount }: { error: WidgetError; retryCount: number } ) {
	if ( ! error ) {
		return (
			<div style={ widgetPreviewStyle }>
				<p style={ mutedTextStyle }>Widget host output</p>
				<div
					style={ {
						alignItems: 'center',
						background: 'var(--wpds-color-bg-surface-success, #edfaef)',
						border: '1px solid var(--wpds-color-stroke-surface-success-strong, #4ab866)',
						borderRadius: '4px',
						display: 'flex',
						minHeight: '72px',
						padding: '12px',
					} }
				>
					Widget content rendered without an error.
				</div>
			</div>
		);
	}

	const config: Partial< WidgetErrorConfig > = error === true ? {} : error;
	const isGlobalWidgetError = config.message === '';

	return (
		<div style={ widgetPreviewStyle }>
			<div style={ { display: 'flex', justifyContent: 'space-between', gap: '12px' } }>
				<div>
					<p style={ mutedTextStyle }>Widget host output</p>
					<h3 style={ { fontSize: '16px', lineHeight: '24px', margin: '4px 0 8px' } }>
						{ isGlobalWidgetError ? 'Global error path' : 'Widget-specific error' }
					</h3>
				</div>
				<StatusPill
					active={ isGlobalWidgetError }
					label={ isGlobalWidgetError ? 'global' : 'local' }
				/>
			</div>

			<WidgetErrorNotice error={ error } />
			<p style={ mutedTextStyle }>Retry count: { retryCount }</p>
		</div>
	);
}

function WidgetErrorSection( { widgetError }: { widgetError: boolean } ) {
	const [ error, setError ] = useState< WidgetError >( null );
	const [ retryCount, setRetryCount ] = useState( 0 );
	const handleRefetch = useCallback( () => setRetryCount( count => count + 1 ), [] );

	return (
		<div style={ sectionStyle }>
			<h3 style={ { fontSize: '16px', lineHeight: '24px', margin: '0 0 4px' } }>
				Widget error consumer
			</h3>
			<p style={ { ...mutedTextStyle, marginBlockEnd: '16px' } }>
				This uses the real <code>WidgetRoot</code> and <code>useWidgetError()</code> path, then
				previews the same notice output used by the widget render host.
			</p>

			<div style={ gridStyle }>
				<div style={ sectionStyle }>
					<WidgetRoot
						attributes={ { reportParams: getDefaultQueryParams( true ) } }
						setError={ setError }
						options={ { from: '/' } }
					>
						<WidgetErrorProbe isError={ widgetError } onRefetch={ handleRefetch } />
					</WidgetRoot>
				</div>
				<WidgetErrorPreview error={ error } retryCount={ retryCount } />
			</div>
		</div>
	);
}

function GlobalErrorProviderDemo( {
	initialGlobalError,
	widgetError,
}: GlobalErrorProviderDemoProps ) {
	useEffect( () => {
		onlineManager.setOnline( true );
		globalErrorManager.setError( initialGlobalError );

		return () => {
			onlineManager.setOnline( true );
			globalErrorManager.clearError();
		};
	}, [ initialGlobalError ] );

	return (
		<GlobalErrorProvider>
			<div style={ pageStyle }>
				<ProviderStatePanel />
				<WidgetErrorSection widgetError={ widgetError } />
			</div>
		</GlobalErrorProvider>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Data/Providers/GlobalErrorProvider',
	component: GlobalErrorProviderDemo,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Story harness for GlobalErrorProvider, useGlobalError, globalErrorManager, onlineManager network state, and the WidgetRoot/useWidgetError consumer path.',
			},
		},
	},
	argTypes: {
		initialGlobalError: {
			control: 'select',
			options: [ null, ...ERROR_TYPES ],
		},
		widgetError: {
			control: 'boolean',
		},
	},
	args: {
		initialGlobalError: null,
		widgetError: true,
	},
} satisfies Meta< typeof GlobalErrorProviderDemo >;

export default meta;

type Story = StoryObj< typeof meta >;

export const Interactive: Story = {};

export const NetworkError: Story = {
	args: {
		initialGlobalError: 'network',
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

export const NoWidgetError: Story = {
	args: {
		widgetError: false,
	},
};
