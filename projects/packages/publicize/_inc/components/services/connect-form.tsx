import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import clsx from 'clsx';
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
	const { fetchKeyringResult, setKeyringResult, completeReconnect } = useDispatch( store );

	// In the modernized chassis the submit button sits flush in a compact
	// disclosure row unless it accompanies the custom-input fields. Legacy
	// passes no `size` (undefined) to keep the trunk button sizing.
	let buttonSize: 'default' | 'compact' | undefined;
	if ( compact ) {
		buttonSize = displayInputs ? 'default' : 'compact';
	}

	const { isConnectionsModalOpen } = useSelect( select => select( store ), [] );

	const reconnectingAccount = useSelect( select => select( store ).getReconnectingAccount(), [] );

	const [ isConnecting, setIsConnecting ] = useState( false );

	const isFetchingServicesList = useSelect(
		select => select( store ).isFetchingServicesList(),
		[]
	);

	const isFetchingKeyringResult = useSelect(
		select => select( store ).isFetchingKeyringResult(),
		[]
	);

	const onConfirm = useCallback(
		async ( requestId: string ) => {
			// Fetch the keyring result only if the modal is open.
			if ( ! isConnectionsModalOpen() ) {
				return;
			}

			const result = await fetchKeyringResult( requestId );

			// If this completed an in-place reconnect (same account), it's already handled;
			// otherwise surface the result so it drives the regular confirmation view.
			const handled = await completeReconnect( result );

			if ( ! handled && result?.ID ) {
				setKeyringResult( result );
			}
		},
		[ completeReconnect, fetchKeyringResult, isConnectionsModalOpen, setKeyringResult ]
	);

	const requestAccess = useRequestAccess( {
		service,
		onConfirm,
	} );

	const onSubmitForm = useCallback(
		async ( event: FormEvent ) => {
			event.preventDefault();
			// Prevent Jetpack settings from being submitted
			event.stopPropagation();

			if ( onSubmit ) {
				return onSubmit();
			}

			setIsConnecting( true );

			const formData = new FormData( event.target as HTMLFormElement );

			// Reconnecting re-auths the existing account, so refresh its token in place.
			await requestAccess( formData, { refresh: Boolean( reconnectingAccount ) } );
		},
		[ onSubmit, reconnectingAccount, requestAccess ]
	);

	return (
		<form
			className={ clsx( styles[ 'connect-form' ], { [ styles.small ]: isSmall } ) }
			onSubmit={ onSubmitForm }
		>
			{ displayInputs ? (
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
					disabled={ isFetchingServicesList || isFetchingKeyringResult }
				>
					{ ( label => {
						if ( label ) {
							return label;
						}

						if ( ( isFetchingServicesList || isFetchingKeyringResult ) && isConnecting ) {
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
