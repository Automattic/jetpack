import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect } from 'react';
import { useAllProducts } from '../../data/products/use-product';
import getProductSlugsThatRequireUserConnection from '../../data/utils/get-product-slugs-that-require-user-connection';
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
	const products = useAllProducts();
	const productSlugsThatRequireUserConnection =
		getProductSlugsThatRequireUserConnection( products );
	const { isSiteConnected, hasConnectedOwner, isUserConnected } = useMyJetpackConnection();

	const requiresUserConnection =
		! hasConnectedOwner && ! isUserConnected && productSlugsThatRequireUserConnection.length > 0;

	const oneProductMessage = sprintf(
		/* translators: placeholder is product name. */
		__(
			'Jetpack %s needs a user connection to WordPress.com to be able to work.',
			'jetpack-my-jetpack'
		),
		productSlugsThatRequireUserConnection[ 0 ]
	);

	const needsUserConnectionMessage =
		productSlugsThatRequireUserConnection.length === 1
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
