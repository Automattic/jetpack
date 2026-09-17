/**
 * External dependencies
 */
import { setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { FIXTURE_SITE_TIME_ZONE, siteSettingsIn } from '../__fixtures__/wp-date-settings';

/**
 * Give Storybook the site date settings a WordPress page would supply.
 *
 * Without them `siteChartFormatting()` reads an empty timezone and charts format
 * their axes in UTC, so a reviewer never sees the site's own zone applied.
 */
export function applyFixtureSiteSettings(): void {
	setSettings( siteSettingsIn( FIXTURE_SITE_TIME_ZONE ) );
}
