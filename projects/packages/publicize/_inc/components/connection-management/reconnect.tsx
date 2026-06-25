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
	const { openConnectionsModal, setReconnectingAccount } = useDispatch( socialStore );

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

	// Local busy state for the button, separate from the store's reconnecting account.
	const [ isReconnecting, setIsReconnecting ] = useState( false );

	// The flow has left this connection (modal closed, or it navigated away) — drop the busy state.
	useEffect( () => {
		if ( ! isReconnectingThis ) {
			setIsReconnecting( false );
		}
	}, [ isReconnectingThis ] );

	const requestAccess = useRequestAccess( { service } );

	const onClickReconnect = useCallback( async () => {
		setIsReconnecting( true );
		await setReconnectingAccount( connection );

		// Bluesky needs a fresh app password, so it reconnects through the modal's credential form.
		// The others re-auth the known account directly via redirect (refresh=1, no delete).
		if ( service.id === 'bluesky' ) {
			openConnectionsModal();
			return;
		}

		const formData = new FormData();

		if ( service.id === 'mastodon' ) {
			formData.set( 'instance', connection.external_handle );
		}

		// On success the tab navigates away; only reset if it didn't start.
		const started = await requestAccess( formData, { refresh: true } );

		if ( ! started ) {
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
