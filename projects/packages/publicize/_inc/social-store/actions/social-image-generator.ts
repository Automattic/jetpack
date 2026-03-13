import { store as coreStore } from '@wordpress/core-data';
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

		await saveSite( { [ SIG_SETTINGS_KEY ]: data } );
	};
}
