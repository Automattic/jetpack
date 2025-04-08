import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { getSocialScriptData } from '../../utils';
import { SocialModuleSettings } from '../types';

/**
 * Returns the Social module settings.
 */
export const getSocialModuleSettings = createRegistrySelector(
	select => (): SocialModuleSettings => {
		const { api_paths, is_publicize_enabled } = getSocialScriptData();

		const data = select( coreStore ).getEntityRecord< SocialModuleSettings >(
			'jetpack/v4',
			api_paths.socialToggleBase
		);

		return data ?? { publicize: is_publicize_enabled };
	}
);

/**
 * Returns whether the Social module settings are being saved
 */
export const isSavingSocialModuleSettings = createRegistrySelector( select => () => {
	const { socialToggleBase } = getSocialScriptData().api_paths;

	return select( coreStore ).isSavingEntityRecord( 'jetpack/v4', socialToggleBase, undefined );
} );
