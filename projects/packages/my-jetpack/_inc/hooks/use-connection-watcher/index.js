import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useContext } from 'react';
import { NoticeContext } from '../../context/notices/noticeContext';
import { useAllProducts } from '../../data/products/use-product';
import getProductSlugsThatRequireUserConnection from '../../data/utils/get-product-slugs-that-require-user-connection';
import useMyJetpackConnection from '../use-my-jetpack-connection';
import useMyJetpackNavigate from '../use-my-jetpack-navigate';

/**
 * React custom hook to watch connection.
 * For instance, when the user is not connected,
 * the hook dispatches an action to populate the global notice.
 */
export default function useConnectionWatcher() {
	const { setNotice } = useContext( NoticeContext );
	const navToConnection = useMyJetpackNavigate( '/connection' );
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
			setNotice( {
				message: needsUserConnectionMessage,
				options: {
					status: 'warning',
					actions: [
						{
							label: __( 'Connect your user account to fix this', 'jetpack-my-jetpack' ),
							onClick: navToConnection,
							noDefaultClasses: true,
						},
					],
				},
			} );
		}
	}, [
		isSiteConnected,
		needsUserConnectionMessage,
		requiresUserConnection,
		navToConnection,
		setNotice,
	] );
}
