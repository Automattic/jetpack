import { getMyJetpackUrl } from '@automattic/jetpack-script-data';
import { useCallback, useMemo } from 'react';
import { useAllProducts } from '../../data/products/use-all-products';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import getProductSlugsThatRequireUserConnection from '../../data/utils/get-product-slugs-that-require-user-connection';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import ConnectionStatusCard from '../connection-status-card';

/**
 * Plan section component.
 *
 * @return {object} ConnectionsSection React component.
 */
export default function ConnectionsSection() {
	const { apiRoot, apiNonce, topJetpackMenuItemUrl, connectedPlugins } = useMyJetpackConnection();
	const { data: products, isLoading, isError } = useAllProducts();
	const { adminUrl } = getMyJetpackWindowInitialState();

	// Handle full site disconnection - redirect to admin
	const onFullyDisconnected = () => {
		if ( adminUrl ) {
			window.location.href = adminUrl;
		} else {
			document?.location?.reload( true );
		}
	};

	// Handle user unlink only - stay in admin, just reload
	const onUserUnlinked = () => {
		document?.location?.reload( true );
	};

	const productsThatRequireUserConnection = useMemo( () => {
		if ( isLoading || isError ) {
			return [];
		}

		return getProductSlugsThatRequireUserConnection( products );
	}, [ products, isLoading, isError ] );

	const onConnectUser = useCallback( () => {
		window.location.href = getMyJetpackUrl( '&step=connect-user' );
	}, [] );
	return (
		<ConnectionStatusCard
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			redirectUri={ topJetpackMenuItemUrl }
			onConnectUser={ onConnectUser }
			connectedPlugins={ connectedPlugins }
			requiresUserConnection={ productsThatRequireUserConnection.length > 0 }
			// eslint-disable-next-line react/jsx-no-bind
			onDisconnected={ onFullyDisconnected }
			// eslint-disable-next-line react/jsx-no-bind
			onUnlinked={ onUserUnlinked }
		/>
	);
}
