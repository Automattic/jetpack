/**
 * External dependencies
 */
import { getSettings, type DateSettings } from '@wordpress/date';

const DEFAULTS = getSettings();

/**
 * The timezone every fixture site sits in.
 *
 * Non-UTC on purpose: on a UTC site a bucket stamp that honours its offset and
 * one that discards it resolve to the same instant, so the fixture would prove
 * nothing.
 */
export const FIXTURE_SITE_TIME_ZONE = 'Asia/Tokyo';

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
