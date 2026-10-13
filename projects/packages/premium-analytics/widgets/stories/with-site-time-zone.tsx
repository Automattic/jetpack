/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { createSiteSettingDecorator } from './with-site-setting';
import type { SiteSettingControl } from './with-site-setting';

// Keyed by city, not by IANA name: Storybook drops a URL arg containing a slash,
// which would silently leave a shared story link on the default zone.
const SITE_TIME_ZONES = {
	Auckland: 'Pacific/Auckland',
	Tokyo: 'Asia/Tokyo',
	London: 'Europe/London',
	'Los Angeles': 'America/Los_Angeles',
} as const;

export interface SiteTimeZoneControls {
	siteTimeZone?: SiteSettingControl< keyof typeof SITE_TIME_ZONES >;
}

const defaultTimeZone = getSettings().timezone;

function offsetFor( timeZone: string ) {
	const zoneName = new Intl.DateTimeFormat( 'en-US', { timeZone, timeZoneName: 'longOffset' } )
		.formatToParts()
		.find( part => part.type === 'timeZoneName' )?.value;
	// UTC formats as a bare `GMT`, every other zone as `GMT±HH:MM`.
	const [ , sign = '+', hours = '00', minutes = '00' ] =
		/GMT([+-])(\d{2}):(\d{2})/.exec( zoneName ?? '' ) ?? [];
	const offset = ( sign === '-' ? -1 : 1 ) * ( Number( hours ) + Number( minutes ) / 60 );

	return { offset, offsetFormatted: `${ sign }${ hours }:${ minutes }` };
}

/**
 * Puts the site's timezone under a story control, so a chart can be read as a
 * viewer outside that zone sees it.
 */
export const { argTypes: siteTimeZoneArgTypes, decorator: withSiteTimeZone } =
	createSiteSettingDecorator( {
		argName: 'siteTimeZone',
		options: Object.keys( SITE_TIME_ZONES ) as ( keyof typeof SITE_TIME_ZONES )[],
		description:
			"The site's WordPress timezone. Chart dates are read in it, so picking a city far from your own shows what a viewer outside the site's zone sees.",
		apply: city => {
			const zone = city ? SITE_TIME_ZONES[ city ] : undefined;

			setSettings( {
				...getSettings(),
				timezone: zone ? { string: zone, abbr: city, ...offsetFor( zone ) } : defaultTimeZone,
			} );
		},
	} );
