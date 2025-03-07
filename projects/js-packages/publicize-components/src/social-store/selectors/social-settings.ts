import { currentUserCan } from '@automattic/jetpack-script-data';
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
	const data = currentUserCan( 'manage_options' )
		? select( coreStore ).getEntityRecord< SocialSettingsFields >( 'root', 'site' )
		: null;

	const { settings } = getSocialScriptData();

	// If we don't have the data yet,
	// return the default settings from the initial state.
	if ( ! data ) {
		return settings;
	}

	// Add safe fallbacks for cases when the REST API doesn't return the expected data.
	// For example when publicize module is disabled, the API doesn't return the settings.
	return {
		showPricingPage: data[ 'jetpack-social_show_pricing_page' ] ?? settings.showPricingPage,
		socialImageGenerator: {
			...settings.socialImageGenerator,
			...data.jetpack_social_image_generator_settings,
		},
		utmSettings: {
			...settings.utmSettings,
			...data.jetpack_social_utm_settings,
		},
		socialNotes: {
			// When it's OFF, the API sometimes returns null,
			// So, to avoid controlled vs uncrontrolled warning, we convert it to false
			enabled: Boolean( data[ 'jetpack-social-note' ] ),
			config: {
				...settings.socialNotes.config,
				...data.jetpack_social_notes_config,
			},
		},
	} satisfies SocialSettings;
} );
