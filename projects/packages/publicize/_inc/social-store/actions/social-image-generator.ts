import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { SIG_SETTINGS_KEY } from '../constants';
import { SocialImageGeneratorConfig } from '../types';

/**
 * Saves the Social Image Generator settings.
 *
 * @param {Partial< SocialImageGeneratorConfig >} data - The data to save.
 *
 * @return {Function} A thunk.
 */
export function updateSocialImageGeneratorConfig( data: Partial< SocialImageGeneratorConfig > ) {
	return async function ( { registry } ) {
		const { saveSite } = registry.dispatch( coreStore );
		const { getLastEntitySaveError } = registry.select( coreStore );
		const { createErrorNotice } = registry.dispatch( noticesStore );

		await saveSite( { [ SIG_SETTINGS_KEY ]: data } );

		const lastError = getLastEntitySaveError( 'root', 'site' );
		if ( lastError ) {
			let message: string = __(
				'There was an error saving the social image settings.',
				'jetpack-publicize-pkg'
			);
			if ( lastError?.message ) {
				message += ' ' + lastError.message;
			}
			createErrorNotice( message, { type: 'snackbar' } );
		}
	};
}
