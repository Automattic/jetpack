import { store as coreStore } from '@wordpress/core-data';
import { SocialPluginSettings } from '../types';

/**
 * Saves the Social plugin settings.
 *
 * @param {Partial< SocialPluginSettings >} data - The data to save.
 *
 * @return {Function} A thunk.
 */
export function updateSocialPluginSettings( data: Partial< SocialPluginSettings > ) {
	return async function ( { registry } ) {
		const { saveEntityRecord } = registry.dispatch( coreStore );

		await saveEntityRecord( 'jetpack/v4', 'social/settings', data );
	};
}
