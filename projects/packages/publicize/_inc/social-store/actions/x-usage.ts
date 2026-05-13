import { store as coreStore } from '@wordpress/core-data';

/**
 * Refreshes the X usage data.
 *
 * @return A thunk to refresh the X usage data.
 */
export function refreshXUsage() {
	return async function ( { registry } ) {
		registry
			.dispatch( coreStore )
			.invalidateResolution( 'getEntityRecords', [ 'wpcom/v2', 'publicize/x-usage' ] );
	};
}
