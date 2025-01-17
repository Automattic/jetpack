import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { getSocialScriptData } from '../../utils';
import { SOCIAL_NOTES_CONFIG_KEY, SOCIAL_NOTES_ENABLED_KEY } from '../constants';
import { SocialNotesConfig } from '../types';

/**
 * Returns if Social Notes are enabled for the current site.
 */
export const getSocialNotesEnabled = createRegistrySelector( select => () => {
	// @ts-expect-error TS2339 - https://github.com/WordPress/gutenberg/issues/67847
	const { getSite } = select( coreStore );

	const settings = getSite( undefined, {
		_fields: SOCIAL_NOTES_ENABLED_KEY,
	} ) as boolean;

	// If the settings are not available in the store yet, use the default settings.
	return (
		settings?.[ SOCIAL_NOTES_ENABLED_KEY ] ??
		getSocialScriptData().settings?.socialPlugin?.social_notes_enabled
	);
} );

/**
 * Returns the Social Notes Config for the current site.
 */
export const getSocialNotesConfig = createRegistrySelector( select => () => {
	// @ts-expect-error TS2339 - https://github.com/WordPress/gutenberg/issues/67847
	const { getSite } = select( coreStore );

	const settings = getSite( undefined, {
		_fields: SOCIAL_NOTES_CONFIG_KEY,
	} ) as SocialNotesConfig;

	// If the settings are not available in the store yet, use the default settings.
	return (
		settings?.[ SOCIAL_NOTES_CONFIG_KEY ] ??
		getSocialScriptData().settings?.socialPlugin?.social_notes_config
	);
} ) as ( state: object ) => SocialNotesConfig;
