import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';

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

	const isFullyConnected =
		Object.keys( connectionStatus ).length &&
		connectionStatus.isUserConnected &&
		connectionStatus.isRegistered;

	return { connectionStatus, isFullyConnected };
}
