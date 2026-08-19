import { store as coreStore } from '@wordpress/core-data';

/**
 * Refreshes the list of supported services.
 *
 * @return A thunk to refresh the list of supported services.
 */
export function refreshServicesList() {
	return async function ( { registry } ) {
		registry
			.dispatch( coreStore )
			.invalidateResolution( 'getEntityRecords', [ 'wpcom/v2', 'publicize/services' ] );

		// Await the refetch so callers can read the fresh list right after.
		await registry.resolveSelect( coreStore ).getEntityRecords( 'wpcom/v2', 'publicize/services' );
	};
}
