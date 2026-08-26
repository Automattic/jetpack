/**
 * External dependencies
 */
import { getSettings, type DateSettings } from '@wordpress/date';

const DEFAULTS = getSettings();

/**
 * Settings for a site in a given timezone, on the US English defaults.
 *
 * @param timeZone - IANA zone name.
 * @return Settings ready for `setSettings`.
 */
export const siteSettingsIn = ( timeZone: string ): DateSettings => ( {
	...DEFAULTS,
	timezone: { ...DEFAULTS.timezone, string: timeZone },
} );
