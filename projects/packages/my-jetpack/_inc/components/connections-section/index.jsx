import { useMemo } from 'react';
import { MyJetpackRoutes } from '../../constants';
import { useAllProducts } from '../../data/products/use-all-products';
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
	const onDisconnected = () => document?.location?.reload( true ); // TODO: replace with a better experience.
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
			onDisconnected={ onDisconnected }
		/>
	);
}
