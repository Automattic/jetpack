import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';
import { STORE_ID as SEARCH_STORE_ID } from 'store';

/**
 * Expose the `connectionStatus`, `isFullyConnected` state object
 *
 * @return {object} connectionStatus, isFullyConnected
 */
export default function useConnection() {
	const connectionStatus = useSelect( select => ( {
		siteIsRegistering: select( CONNECTION_STORE_ID ).getSiteIsRegistering(),
		userIsConnecting: select( CONNECTION_STORE_ID ).getUserIsConnecting(),
		userConnectionData: select( CONNECTION_STORE_ID ).getUserConnectionData(),
		connectedPlugins: select( CONNECTION_STORE_ID ).getConnectedPlugins(),
		connectionErrors: select( CONNECTION_STORE_ID ).getConnectionErrors(),
		...select( CONNECTION_STORE_ID ).getConnectionStatus(),
	} ) );
	const isWpcom = useSelect( select => select( SEARCH_STORE_ID ).isWpcom(), [] );
	const isOfflineMode = Boolean( connectionStatus?.offlineMode?.isActive );

	// Local development mode sites can never complete a real connection (the
	// handshake needs WordPress.com to reach back to this site), but the REST
	// data underneath the dashboard is mocked in that case (see
	// Plan::get_plan_info_from_wpcom() / Stats::get_stats_from_wpcom()), so the
	// real dashboard is safe to render rather than showing a bare connect wall.
	const isFullyConnected =
		( Object.keys( connectionStatus ).length &&
			connectionStatus.hasConnectedOwner &&
			connectionStatus.isRegistered ) ||
		isWpcom ||
		isOfflineMode;

	const isSiteConnected =
		( Object.keys( connectionStatus ).length && connectionStatus.isRegistered ) ||
		isWpcom ||
		isOfflineMode;

	return { connectionStatus, isFullyConnected, isSiteConnected, isOfflineMode };
}
