import { store as coreStore } from '@wordpress/core-data';
import { getSocialScriptData } from '../../utils';
import { SocialModuleSettings } from '../types';

/**
 * Saves the Social module settings.
 *
 * @param data - The data to save.
 *
 * @return A thunk.
 */
export function updateSocialModuleSettings( data: Partial< SocialModuleSettings > ) {
	return async function ( { registry } ) {
		const { socialToggleBase } = getSocialScriptData().api_paths;

		const { saveEntityRecord } = registry.dispatch( coreStore );

		await saveEntityRecord( 'jetpack/v4', socialToggleBase, data );
	};
}
