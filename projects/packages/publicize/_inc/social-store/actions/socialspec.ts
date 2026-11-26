import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { SOCIALSPEC_SETTINGS_KEY } from '../constants';
import { SocialspecSettings } from '../types';

/**
 * Saves SocialSpec settings. The server keeps the ones that are not passed.
 *
 * @param {Partial< SocialspecSettings >} data - The settings to save.
 *
 * @return {Function} A thunk.
 */
export function updateSocialspecSettings( data: Partial< SocialspecSettings > ) {
	return async function ( { registry } ) {
		const { saveSite } = registry.dispatch( coreStore );
		const { getLastEntitySaveError } = registry.select( coreStore );
		const { createErrorNotice } = registry.dispatch( noticesStore );

		await saveSite( { [ SOCIALSPEC_SETTINGS_KEY ]: data } );

		const lastError = getLastEntitySaveError( 'root', 'site' );
		if ( lastError ) {
			let message: string = __(
				'There was an error saving the social web profile settings.',
				'jetpack-publicize-pkg'
			);
			if ( lastError?.message ) {
				message += ' ' + lastError.message;
			}
			createErrorNotice( message, { type: 'snackbar' } );
		}
	};
}
