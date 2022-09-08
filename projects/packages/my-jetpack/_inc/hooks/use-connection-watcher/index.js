import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect } from 'react';
import { STORE_ID } from '../../state/store';
import useMyJetpackConnection from '../use-my-jetpack-connection';
import useMyJetpackNavigate from '../use-my-jetpack-navigate';

/**
 * React custom hook to watch connection.
 * For instance, when the user is not connected,
 * the hook dispatches an action to populate the global notice.
 */
export default function useConnectionWatcher() {
	const navToConnection = useMyJetpackNavigate( '/connection' );
	const { setGlobalNotice } = useDispatch( STORE_ID );
	const productsThatRequiresUserConnection = useSelect( select =>
		select( STORE_ID ).getProductsThatRequiresUserConnection()
	);
	const { isSiteConnected, topJetpackMenuItemUrl, hasConnectedOwner } = useMyJetpackConnection();

	const requiresUserConnection =
		! hasConnectedOwner && productsThatRequiresUserConnection.length > 0;

	const oneProductMessage = sprintf(
		/* translators: placeholder is product name. */
		__(
			'Jetpack %s needs a user connection to Jetpack.com to be able to work.',
			'jetpack-my-jetpack'
		),
		productsThatRequiresUserConnection[ 0 ]
	);

	const message =
		productsThatRequiresUserConnection.length > 1
			? __(
					'Some products need a user connection to Jetpack.com to be able to work.',
					'jetpack-my-jetpack'
			  )
			: oneProductMessage;

	/*
	 * When the site is not connect, redirect to the Jetpack dashboard.
	 */
	useEffect( () => {
		if ( ! isSiteConnected && topJetpackMenuItemUrl ) {
			window.location = topJetpackMenuItemUrl;
		}
	}, [ isSiteConnected, topJetpackMenuItemUrl ] );

	useEffect( () => {
		if ( requiresUserConnection ) {
			setGlobalNotice( message, {
				status: 'error',
				actions: [
					{
						label: __( 'Connect your user account to fix this', 'jetpack-my-jetpack' ),
						onClick: navToConnection,
						variant: 'link',
						noDefaultClasses: true,
					},
				],
			} );
		}
	}, [ message, requiresUserConnection, navToConnection, setGlobalNotice ] );
}
