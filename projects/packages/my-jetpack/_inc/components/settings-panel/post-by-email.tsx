import { getRedirectUrl } from '@automattic/jetpack-components';
import { speak } from '@wordpress/a11y';
import { useCopyToClipboard } from '@wordpress/compose';
import { __, _x } from '@wordpress/i18n';
import { check, copy, error } from '@wordpress/icons';
import { Button, InputControl, InputLayout, Link, Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect, useId, useState } from 'react';
import { moduleSwitchKey, useRequestedSwitch } from '../../data/requested-switch-state';
import { useAccountConnected } from '../my-jetpack-tab-panel/features/feature-state';
import { PanelModuleToggle } from './panel-module-toggle';
import styles from './styles.module.scss';
import { useModuleSetting } from './use-module-option';
import type { ModuleSettingsProps } from './registry';

const ADDRESS_OPTION = 'post_by_email_address';

const COPY_FEEDBACK_TIMEOUT = 2000;
const COPY_ICON = { idle: copy, copied: check, error };

// A user with no address yet reads as false, '1', null or 'NULL'.
const toAddress = ( stored: unknown ) =>
	typeof stored === 'string' && stored.includes( '@' ) ? stored : '';

/**
 * The Post by Email options: the current user's own address, which only they can create.
 *
 * @param props          - Component props.
 * @param props.module   - The module.
 * @param props.disabled - Whether the site cannot use the module.
 * @return The settings.
 */
export function PostByEmailSettings( { module: $module, disabled }: ModuleSettingsProps ) {
	const accountConnected = useAccountConnected();
	const request = useModuleSetting( $module, ADDRESS_OPTION, toAddress );
	// A new object per result restarts the timeout on repeated copies.
	const [ copyFeedback, setCopyFeedback ] = useState< { result: keyof typeof COPY_ICON } >( {
		result: 'idle',
	} );
	const labelId = useId();

	// While a request runs, the hook's value is the action sent, so read the stored address here.
	const option = Array.isArray( $module.options ) ? undefined : $module.options?.[ ADDRESS_OPTION ];
	const address = toAddress( ( option as { current_value?: unknown } | undefined )?.current_value );
	// Lock from the click on the module switch, not from its response.
	const switching = useRequestedSwitch( moduleSwitchKey( $module.module ) ) !== null;
	const locked = ! $module.activated || switching || disabled || ! accountConnected;
	const canCopy = ! locked && !! address;

	const copyRef = useCopyToClipboard< HTMLButtonElement >(
		address,
		() => {
			setCopyFeedback( { result: 'copied' } );
			speak( __( 'Copied to clipboard', 'jetpack-my-jetpack' ) );
		},
		// Core's `wp-compose` ignores this before @wordpress/compose 9.1.0.
		() => {
			setCopyFeedback( { result: 'error' } );
			speak( __( 'Couldn’t copy to clipboard.', 'jetpack-my-jetpack' ) );
		}
	);
	useEffect( () => {
		if ( copyFeedback.result === 'idle' ) {
			return;
		}
		const timer = setTimeout( () => setCopyFeedback( { result: 'idle' } ), COPY_FEEDBACK_TIMEOUT );
		return () => clearTimeout( timer );
	}, [ copyFeedback ] );

	const { setValue } = request;
	const regenerate = useCallback( () => setValue( 'regenerate' ), [ setValue ] );

	return (
		<Stack direction="column" gap="lg">
			<Text variant="body-md">
				{ __(
					'Post by email is a quick way to publish new posts without visiting your site. We’ll generate a unique email address for you to send your content to, which will then appear on your site just like any other post.',
					'jetpack-my-jetpack'
				) }
			</Text>
			<Link
				href={ getRedirectUrl( 'jetpack-support-post-by-email' ) }
				target="_blank"
				rel="noopener noreferrer"
			>
				{ __( 'Learn more about Post by Email', 'jetpack-my-jetpack' ) }
			</Link>

			<Stack
				direction="row"
				align="center"
				justify="space-between"
				className={ styles[ 'settings-panel__toggle' ] }
			>
				<Text variant="body-md" id={ labelId }>
					{ $module.description }
				</Text>
				<PanelModuleToggle
					module={ $module }
					labelledby={ labelId }
					disabled={ disabled || ! accountConnected }
				/>
			</Stack>

			{ ! disabled && ! accountConnected && (
				<Text variant="body-md">
					{ __(
						'Connect your WordPress.com account to get your own Post by Email address.',
						'jetpack-my-jetpack'
					) }
				</Text>
			) }

			<InputControl
				label={ __( 'Send your new posts to this email address:', 'jetpack-my-jetpack' ) }
				value={ address }
				readOnly
				disabled={ locked }
				suffix={
					<InputLayout.Slot padding="minimal" className={ styles[ 'post-by-email__copy-slot' ] }>
						{ /* A disabled @wordpress/ui Button does not block the hook's DOM click listener (WordPress/gutenberg#86445), so attach the ref only while copying is allowed. */ }
						<Button
							ref={ canCopy ? copyRef : undefined }
							variant="minimal"
							tone="neutral"
							size="small"
							disabled={ ! canCopy }
						>
							<Button.Icon icon={ COPY_ICON[ copyFeedback.result ] } />
							{ _x( 'Copy', 'verb', 'jetpack-my-jetpack' ) }
						</Button>
					</InputLayout.Slot>
				}
			/>
			<div>
				<Button
					variant="outline"
					size="compact"
					disabled={ locked || request.isSaving }
					loading={ request.isSaving }
					onClick={ regenerate }
				>
					{ address
						? __( 'Regenerate address', 'jetpack-my-jetpack' )
						: __( 'Create address', 'jetpack-my-jetpack' ) }
				</Button>
			</div>
		</Stack>
	);
}
