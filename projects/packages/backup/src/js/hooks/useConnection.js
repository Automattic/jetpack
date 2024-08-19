import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';

/**
 * Expose the `connectionStatus` state object and `BackupConnectionScreen` to show a component used for connection.
 *
 * @returns {Array} connectionStatus, BackupConnectionScreen
 */
export default function useConnection() {
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);

	return connectionStatus;
}
