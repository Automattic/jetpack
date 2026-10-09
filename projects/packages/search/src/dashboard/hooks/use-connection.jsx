import { initConnectionStore } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';
import { STORE_ID as SEARCH_STORE_ID } from 'store';

/**
 * Expose the `connectionStatus`, `isFullyConnected` state object
 *
 * @return {object} connectionStatus, isFullyConnected
 */
export default function useConnection() {
	const connectionStore = initConnectionStore();
	const connectionStatus = useSelect(
		select => ( {
			siteIsRegistering: select( connectionStore ).getSiteIsRegistering(),
			userIsConnecting: select( connectionStore ).getUserIsConnecting(),
			userConnectionData: select( connectionStore ).getUserConnectionData(),
			connectedPlugins: select( connectionStore ).getConnectedPlugins(),
			connectionErrors: select( connectionStore ).getConnectionErrors(),
			...select( connectionStore ).getConnectionStatus(),
		} ),
		[ connectionStore ]
	);
	const isWpcom = useSelect( select => select( SEARCH_STORE_ID ).isWpcom(), [] );

	const isFullyConnected =
		( Object.keys( connectionStatus ).length &&
			connectionStatus.hasConnectedOwner &&
			connectionStatus.isRegistered ) ||
		isWpcom;

	const isSiteConnected =
		( Object.keys( connectionStatus ).length && connectionStatus.isRegistered ) || isWpcom;

	return { connectionStatus, isFullyConnected, isSiteConnected };
}
