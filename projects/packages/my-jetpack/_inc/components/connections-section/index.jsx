import useProductsThatRequireUserConnection from '../../data/products/use-products-that-require-user-connection';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import ConnectionStatusCard from '../connection-status-card';

/**
 * Plan section component.
 *
 * @returns {object} ConnectionsSection React component.
 */
export default function ConnectionsSection() {
	const { apiRoot, apiNonce, topJetpackMenuItemUrl, connectedPlugins } = useMyJetpackConnection();
	const navigate = useMyJetpackNavigate( '/connection' );
	const onDisconnected = () => document?.location?.reload( true ); // TODO: replace with a better experience.
	const productsThatRequireUserConnection = useProductsThatRequireUserConnection();

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
