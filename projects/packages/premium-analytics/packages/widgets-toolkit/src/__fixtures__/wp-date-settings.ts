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

// The locale fixtures live with the formatter that owns `date_format` handling;
// re-exported here so suites in this package keep one fixture entry point.
export {
	EN_US_SETTINGS,
	ES_ES_SETTINGS,
} from '../../../formatters/src/date/__fixtures__/wp-date-settings';
