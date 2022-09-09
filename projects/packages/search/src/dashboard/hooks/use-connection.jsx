import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';
import { STORE_ID as SEARCH_STORE_ID } from 'store';

/**
 * Expose the `connectionStatus`, `isFullyConnected` state object
 *
 * @returns {Object} connectionStatus, isFullyConnected
 */
export default function useConnection() {
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
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
