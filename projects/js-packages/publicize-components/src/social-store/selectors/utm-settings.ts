import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { getSocialScriptData } from '../../utils';
import { UTM_ENABLED_KEY } from '../constants';
import { SocialSettingsFields, UtmSettingsConfig } from '../types';

/**
 * Returns the UTM state.
 */
export const getUtmSettings = createRegistrySelector( select => () => {
	// @ts-expect-error TS2339 - https://github.com/WordPress/gutenberg/issues/67847
	const { getSite } = select( coreStore );

	const settings = getSite( undefined, { _fields: UTM_ENABLED_KEY } ) as SocialSettingsFields;

	// If the settings are not available in the store yet, use the default settings.
	return settings?.[ UTM_ENABLED_KEY ] ?? getSocialScriptData().settings.utmSettings;
} ) as ( state: object ) => UtmSettingsConfig;
