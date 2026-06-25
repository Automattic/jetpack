import { getAdminUrl } from '@automattic/jetpack-script-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
import clsx from 'clsx';
import { useIsEditor } from '../../hooks/use-is-editor';
import { useIsModernized } from '../../hooks/use-is-modernized';
import { store } from '../../social-store';
import { CustomInputs } from './custom-inputs';
import { ModernCustomInputs } from './custom-inputs-modern';
import styles from './style.module.scss';
import { SupportedService } from './types';
import { useRequestAccess } from './use-request-access';
import type { FormEvent } from 'react';

type ConnectFormProps = {
	service: SupportedService;
	isSmall?: boolean;
	onSubmit?: VoidFunction;
	displayInputs?: boolean;
	hasConnections?: boolean;
	buttonLabel?: string;
	/** When true, the modernized chassis sizes the submit button to sit flush in a disclosure row. */
	compact?: boolean;
};

/**
 * Connect form component
 *
 * @param {ConnectFormProps} props - Component props
 *
 * @return Connect form component
 */
export function ConnectForm( {
	service,
	isSmall,
	onSubmit,
	displayInputs,
	hasConnections,
	buttonLabel,
	compact,
}: ConnectFormProps ) {
	const isModernized = useIsModernized();

	// In the modernized chassis the submit button sits flush in a compact
	// disclosure row unless it accompanies the custom-input fields. Legacy
	// passes no `size` (undefined) to keep the trunk button sizing.
	let buttonSize: 'default' | 'compact' | undefined;
	if ( compact ) {
		buttonSize = displayInputs ? 'default' : 'compact';
	}

	const reconnectingAccount = useSelect( select => select( store ).getReconnectingAccount(), [] );

	// In the editor we don't redirect the tab; we open the connect flow on the Social admin page.
	const isEditor = useIsEditor();

	const { setConnectingService } = useDispatch( store );

	// In the editor, this service shows "Connecting…" while its admin tab is in flight.
	const isConnectingThis = useSelect(
		select => isEditor && select( store ).getConnectingService() === service.id,
		[ isEditor, service.id ]
	);

	const [ isConnecting, setIsConnecting ] = useState( false );

	const isFetchingServicesList = useSelect(
		select => select( store ).isFetchingServicesList(),
		[]
	);

	const requestAccess = useRequestAccess( { service } );

	const onSubmitForm = useCallback(
		async ( event: FormEvent ) => {
			event.preventDefault();
			// Prevent Jetpack settings from being submitted
			event.stopPropagation();

			if ( onSubmit ) {
				return onSubmit();
			}

			// Editor: open the Social admin page in a new tab to connect there (synchronous, to
			// keep the user gesture for window.open).
			if ( isEditor ) {
				window.open(
					getAdminUrl(
						addQueryArgs( 'admin.php', {
							page: 'jetpack-social',
							connect: service.id,
							source: 'editor',
						} )
					),
					'_blank'
				);
				// Keep the picker showing "Connecting…" until the connection lands (or times out).
				setConnectingService( service.id );
				return;
			}

			setIsConnecting( true );

			const formData = new FormData( event.target as HTMLFormElement );

			// Reconnecting re-auths the existing account, so refresh its token in place. On success
			// the tab navigates away; only reset the busy state if it didn't start.
			const started = await requestAccess( formData, { refresh: Boolean( reconnectingAccount ) } );

			if ( ! started ) {
				setIsConnecting( false );
			}
		},
		[ isEditor, onSubmit, reconnectingAccount, requestAccess, service.id, setConnectingService ]
	);

	const showConnecting = isFetchingServicesList || isConnecting || isConnectingThis;

	return (
		<form
			className={ clsx( styles[ 'connect-form' ], { [ styles.small ]: isSmall } ) }
			onSubmit={ onSubmitForm }
		>
			{ displayInputs && ! isEditor ? (
				<div className={ clsx( styles[ 'fields-wrapper' ], styles.input ) }>
					{ isModernized ? (
						<ModernCustomInputs service={ service } />
					) : (
						<CustomInputs service={ service } />
					) }
				</div>
			) : null }

			<div className={ styles[ 'fields-wrapper' ] }>
				<Button
					variant={ hasConnections ? 'outline' : 'solid' }
					size={ buttonSize }
					type="submit"
					disabled={ showConnecting }
				>
					{ ( label => {
						if ( label && ! isConnectingThis ) {
							return label;
						}

						if ( showConnecting ) {
							return __( 'Connecting…', 'jetpack-publicize-pkg' );
						}

						// Hold each label in its own variable and select with the
						// ternary afterwards. Picking inline (`cond ? __( 'A' ) :
						// __( 'B' )`) lets the minifier fold both branches into one
						// `__( cond ? 'A' : 'B' )` call, which the i18n string
						// extraction can no longer read.
						const connectMoreLabel = __( 'Connect more', 'jetpack-publicize-pkg' );
						const connectLabel = __( 'Connect', 'jetpack-publicize-pkg' );
						return hasConnections ? connectMoreLabel : connectLabel;
					} )( buttonLabel ) }
				</Button>
			</div>
		</form>
	);
}
