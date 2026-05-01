import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';

/**
 * Read the Jetpack connection status from the connection store. Returns an
 * empty object until the store has hydrated — `Gates` uses the empty-object
 * shape as a "still loading" signal so the page can render a placeholder
 * before deciding whether to show the connection screen or the overview.
 *
 * @return The connection status snapshot.
 */
export default function useConnection(): Record< string, unknown > {
	return useSelect(
		select =>
			(
				select( CONNECTION_STORE_ID ) as { getConnectionStatus: () => Record< string, unknown > }
			 ).getConnectionStatus(),
		[]
	);
}
