import { store as coreStore } from '@wordpress/core-data';
import { UTM_ENABLED_KEY } from '../constants';
import { UtmSettingsConfig } from '../types';

/**
 * Saves the UTM status.
 *
 * @param {Partial< UtmSettingsConfig >} data - The data to save.
 *
 * @return {Function} A thunk.
 */
export function updateUtmSettings( data: Partial< UtmSettingsConfig > ) {
	return async function ( { registry } ) {
		const { saveSite } = registry.dispatch( coreStore );

		await saveSite( { [ UTM_ENABLED_KEY ]: data } );
	};
}
