import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { getSocialScriptData } from '../../utils';
import { SocialModuleSettings } from '../types';

/**
 * Returns the Social module settings.
 */
export const getSocialModuleSettings = createRegistrySelector( select => () => {
	const { socialToggleBase } = getSocialScriptData().api_paths;

	const data = select( coreStore ).getEntityRecord( 'jetpack/v4', socialToggleBase, undefined );

	return ( data ?? {
		publicize: getSocialScriptData().is_publicize_enabled,
	} ) as SocialModuleSettings;
} );

/**
 * Returns whether the Social module settings are being saved
 */
export const isSavingSocialModuleSettings = createRegistrySelector( select => () => {
	const { socialToggleBase } = getSocialScriptData().api_paths;

	return select( coreStore ).isSavingEntityRecord( 'jetpack/v4', socialToggleBase, undefined );
} );
