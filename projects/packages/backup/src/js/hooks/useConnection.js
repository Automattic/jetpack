import { initConnectionStore } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';

/**
 * Expose the `connectionStatus` state object from the Jetpack connection store.
 *
 * @return {object} connectionStatus The connection status object.
 */
export default function useConnection() {
	const connectionStore = initConnectionStore();
	const connectionStatus = useSelect(
		select => select( connectionStore ).getConnectionStatus(),
		[ connectionStore ]
	);

	return connectionStatus;
}
