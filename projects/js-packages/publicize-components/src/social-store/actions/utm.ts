import { store as coreStore } from '@wordpress/core-data';
import { UTM_ENABLED_KEY } from '../constants';

/**
 * Saves the UTM status.
 *
 * @param {boolean} enabled - The data to save.
 *
 * @return {Function} A thunk.
 */
export function updateIsUtmEnabled( enabled: boolean ) {
	return async function ( { registry } ) {
		const { saveSite } = registry.dispatch( coreStore );

		await saveSite( { [ UTM_ENABLED_KEY ]: enabled } );
	};
}
