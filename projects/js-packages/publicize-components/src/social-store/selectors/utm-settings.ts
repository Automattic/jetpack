import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { getSocialScriptData } from '../../utils';
import { UTM_ENABLED_KEY } from '../constants';

/**
 * Returns the UTM state.
 */
export const getUtmSettings = createRegistrySelector( select => () => {
	const { getSite } = select( coreStore );

	const settings = getSite( undefined, { _fields: UTM_ENABLED_KEY } );

	// If the settings are not available in the store yet, use the default settings.
	return settings?.[ UTM_ENABLED_KEY ] ?? getSocialScriptData().settings.utmSettings;
} );
