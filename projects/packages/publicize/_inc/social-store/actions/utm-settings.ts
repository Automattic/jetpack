import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
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
		const { getLastEntitySaveError } = registry.select( coreStore );
		const { createErrorNotice } = registry.dispatch( noticesStore );

		await saveSite( { [ UTM_ENABLED_KEY ]: data } );

		const lastError = getLastEntitySaveError( 'root', 'site' );
		if ( lastError ) {
			let message: string = __(
				'There was an error saving the link tracking settings.',
				'jetpack-publicize-pkg'
			);
			if ( lastError?.message ) {
				message += ' ' + lastError.message;
			}
			createErrorNotice( message, { type: 'snackbar' } );
		}
	};
}
