import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { SocialSettings } from '../../types';
import { getSocialScriptData } from '../../utils';
import { SocialSettingsFields } from '../types';

/**
 * Returns whether the site settings are being saved.
 */
export const isSavingSiteSettings = createRegistrySelector( select => () => {
	return select( coreStore ).isSavingEntityRecord( 'root', 'site', undefined );
} );

/**
 * Returns the social settings.
 */
export const getSocialSettings = createRegistrySelector( select => () => {
	const data = select( coreStore ).getEntityRecord< SocialSettingsFields >( 'root', 'site' );

	// If we don't have the data yet,
	// return the default settings from the initial state.
	if ( ! data ) {
		return getSocialScriptData().settings;
	}

	return {
		showPricingPage: data[ 'jetpack-social_show_pricing_page' ],
		socialImageGenerator: data.jetpack_social_image_generator_settings,
		utmSettings: data.jetpack_social_utm_settings,
		socialNotes: {
			// When it's OFF, the API sometimes returns null,
			// So, to avoid controlled vs uncrontrolled warning, we convert it to false
			enabled: Boolean( data[ 'jetpack-social-note' ] ),
			config: data.jetpack_social_notes_config,
		},
	} satisfies SocialSettings;
} );
