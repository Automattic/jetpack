import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect } from 'react';
import useProductsThatRequireUserConnection from '../../data/products/use-products-that-require-user-connection';
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
	const productsThatRequiresUserConnection = useProductsThatRequireUserConnection();
	const { isSiteConnected, hasConnectedOwner, isUserConnected } = useMyJetpackConnection();

	const requiresUserConnection =
		! hasConnectedOwner && ! isUserConnected && productsThatRequiresUserConnection.length > 0;

	const oneProductMessage = sprintf(
		/* translators: placeholder is product name. */
		__(
			'Jetpack %s needs a user connection to WordPress.com to be able to work.',
			'jetpack-my-jetpack'
		),
		productsThatRequiresUserConnection[ 0 ]
	);

	const needsUserConnectionMessage =
		productsThatRequiresUserConnection.length === 1
			? oneProductMessage
			: __(
					'Some products need a user connection to WordPress.com to be able to work.',
					'jetpack-my-jetpack'
			  );

	useEffect( () => {
		if ( ! isSiteConnected || requiresUserConnection ) {
			setGlobalNotice( needsUserConnectionMessage, {
				status: 'warning',
				actions: [
					{
						label: __( 'Connect your user account to fix this', 'jetpack-my-jetpack' ),
						onClick: navToConnection,
						noDefaultClasses: true,
					},
				],
			} );
		}
	}, [
		isSiteConnected,
		needsUserConnectionMessage,
		requiresUserConnection,
		navToConnection,
		setGlobalNotice,
	] );
}
