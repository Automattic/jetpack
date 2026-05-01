import { useSelect } from '@wordpress/data';

// Hard-coded `STORE_ID` from `@automattic/jetpack-connection`'s
// `state/store-id.jsx`. Inlined so the wp-build bundle doesn't have to
// pull in jetpack-connection's full module tree (which references
// disconnect-dialog images that esbuild has no loader for).
const CONNECTION_STORE_ID = 'jetpack-connection';

/**
 * Read the Jetpack connection status from the connection store.
 * Returns an empty object until the store has hydrated — `Gates` uses
 * the empty-object shape as a "still loading" signal so the page can
 * render a placeholder before deciding whether to show the connection
 * screen or the overview.
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
