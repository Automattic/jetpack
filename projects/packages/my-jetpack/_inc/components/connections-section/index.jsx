import { useMemo } from 'react';
import { MyJetpackRoutes } from '../../constants';
import { useAllProducts } from '../../data/products/use-all-products';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import getProductSlugsThatRequireUserConnection from '../../data/utils/get-product-slugs-that-require-user-connection';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import ConnectionStatusCard from '../connection-status-card';

/**
 * Plan section component.
 *
 * @return {object} ConnectionsSection React component.
 */
export default function ConnectionsSection() {
	const { apiRoot, apiNonce, topJetpackMenuItemUrl, connectedPlugins } = useMyJetpackConnection();
	const navigate = useMyJetpackNavigate( MyJetpackRoutes.ConnectionSkipPricing );
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

	return (
		<ConnectionStatusCard
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			redirectUri={ topJetpackMenuItemUrl }
			onConnectUser={ navigate }
			connectedPlugins={ connectedPlugins }
			requiresUserConnection={ productsThatRequireUserConnection.length > 0 }
			// eslint-disable-next-line react/jsx-no-bind
			onDisconnected={ onFullyDisconnected }
			// eslint-disable-next-line react/jsx-no-bind
			onUnlinked={ onUserUnlinked }
		/>
	);
}
