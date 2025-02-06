import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';

/**
 * Expose the `connectionStatus` state object from the Jetpack connection store.
 *
 * @return {object} connectionStatus The connection status object.
 */
export default function useConnection() {
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);

	return connectionStatus;
}
