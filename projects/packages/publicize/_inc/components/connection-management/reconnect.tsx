import { useGlobalNotices } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';
import { SupportedService } from '../services/types';
import { useRequestAccess } from '../services/use-request-access';

export type ReconnectProps = {
	service: SupportedService;
	connection: Connection;
};

/**
 * Reconnect component
 *
 * @param {ReconnectProps} props - component props
 *
 * @return {import('react').ReactNode} - React element
 */
export function Reconnect( { connection, service }: ReconnectProps ) {
	const {
		fetchKeyringResult,
		setKeyringResult,
		openConnectionsModal,
		setReconnectingAccount,
		completeReconnect,
	} = useDispatch( socialStore );

	const { createErrorNotice } = useGlobalNotices();

	const { canManageConnection, isReconnectingThis } = useSelect(
		select => {
			const { canUserManageConnection, getReconnectingAccount } = select( socialStore );

			return {
				canManageConnection: canUserManageConnection( connection ),
				isReconnectingThis: getReconnectingAccount()?.connection_id === connection.connection_id,
			};
		},
		[ connection ]
	);

	// Local busy state for the button. Kept separate from the store's reconnecting account so
	// that resetting it (e.g. on an abandoned popup) can never disrupt the actual reconnect.
	const [ isReconnecting, setIsReconnecting ] = useState( false );

	// The flow has left this connection (completed in place, or the modal closed) — stop showing
	// the busy state.
	useEffect( () => {
		if ( ! isReconnectingThis ) {
			setIsReconnecting( false );
		}
	}, [ isReconnectingThis ] );

	const onConfirm = useCallback(
		async ( requestId: string ) => {
			const result = await fetchKeyringResult( requestId );

			if ( ! result?.ID ) {
				/*
				 * The popup completed (so the connect-window abort cleanup won't run) but returned
				 * no usable result. Clear the busy state here so the row doesn't stay stuck, and let
				 * the user retry.
				 */
				setIsReconnecting( false );
				setReconnectingAccount( undefined );
				createErrorNotice(
					__(
						'The reconnection could not be completed. Please try again.',
						'jetpack-publicize-pkg'
					)
				);
				return;
			}

			/*
			 * Same account re-authed: keyring refreshed the token under the existing connection,
			 * so it's valid again. A different account falls through to the confirmation modal,
			 * where it shows up as a new account to add.
			 */
			const handled = await completeReconnect( result );

			if ( ! handled ) {
				// Different account — surface the result so the modal shows the confirmation view.
				setKeyringResult( result );
				openConnectionsModal();
			}
		},
		[
			completeReconnect,
			createErrorNotice,
			fetchKeyringResult,
			openConnectionsModal,
			setKeyringResult,
			setReconnectingAccount,
		]
	);

	const requestAccess = useRequestAccess( { service, onConfirm } );

	const onClickReconnect = useCallback( async () => {
		setIsReconnecting( true );
		await setReconnectingAccount( connection );

		/*
		 * Bluesky needs a fresh app password, so it reconnects through the modal's credential
		 * form. Mastodon and the OAuth services re-auth the known account directly in a popup,
		 * refreshing the token in place (no delete, no duplicate).
		 */
		if ( service.id === 'bluesky' ) {
			openConnectionsModal();
			return;
		}

		const formData = new FormData();

		if ( service.id === 'mastodon' ) {
			formData.set( 'instance', connection.external_handle );
		}

		const opened = await requestAccess( formData, {
			refresh: true,
			// The user closed/dismissed the popup — drop the busy label (the reconnect itself
			// is untouched, so a late result can still complete it).
			onAbort: () => setIsReconnecting( false ),
		} );

		if ( ! opened ) {
			setIsReconnecting( false );
			setReconnectingAccount( undefined );
		}
	}, [ connection, openConnectionsModal, requestAccess, service.id, setReconnectingAccount ] );

	const onClick = useCallback(
		( event: React.MouseEvent ) => {
			event.preventDefault();
			if ( ! isReconnecting ) {
				onClickReconnect();
			}
		},
		[ isReconnecting, onClickReconnect ]
	);

	if ( ! canManageConnection ) {
		return null;
	}

	if ( isReconnecting ) {
		// Make it non-interactive
		return (
			<Link href="#" variant={ 'unstyled' } aria-disabled>
				{ __( 'Reconnecting…', 'jetpack-publicize-pkg' ) }
			</Link>
		);
	}

	return (
		<Link href="#" onClick={ onClick }>
			{ _x( 'Reconnect', 'Reconnect a social media account', 'jetpack-publicize-pkg' ) }
		</Link>
	);
}
