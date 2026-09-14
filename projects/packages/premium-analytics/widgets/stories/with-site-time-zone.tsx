/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
import { useEffect } from 'react';
import type { Decorator } from '@storybook/react';
import type { ReactNode } from 'react';

export const SITE_TIME_ZONE_DEFAULT = 'Site default';

// Keyed by city, not by IANA name: Storybook drops a URL arg containing a slash,
// which would silently leave a shared story link on the default zone.
const SITE_TIME_ZONES = {
	Auckland: 'Pacific/Auckland',
	Tokyo: 'Asia/Tokyo',
	London: 'Europe/London',
	'Los Angeles': 'America/Los_Angeles',
} as const;

export interface SiteTimeZoneControls {
	siteTimeZone?: typeof SITE_TIME_ZONE_DEFAULT | keyof typeof SITE_TIME_ZONES;
}

export const siteTimeZoneArgTypes = {
	siteTimeZone: {
		control: 'select',
		options: [ SITE_TIME_ZONE_DEFAULT, ...Object.keys( SITE_TIME_ZONES ) ],
		description:
			"The site's WordPress timezone. Chart dates are read in it, so picking a city far from your own shows what a viewer outside the site's zone sees.",
	},
} as const;

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

function applySiteTimeZone( city: SiteTimeZoneControls[ 'siteTimeZone' ] ) {
	const zone = city && city !== SITE_TIME_ZONE_DEFAULT ? SITE_TIME_ZONES[ city ] : undefined;

	setSettings( {
		...getSettings(),
		timezone: zone ? { string: zone, abbr: city as string, ...offsetFor( zone ) } : defaultTimeZone,
	} );
}

function SiteTimeZone( {
	city,
	children,
}: {
	city: SiteTimeZoneControls[ 'siteTimeZone' ];
	children: ReactNode;
} ) {
	// Applied during render: the widget reads the setting while rendering below.
	applySiteTimeZone( city );
	useEffect( () => () => applySiteTimeZone( undefined ), [] );

	return <>{ children }</>;
}

/**
 * Puts the site's timezone under a story control, so a chart can be read as a
 * viewer outside that zone sees it.
 */
export const withSiteTimeZone: Decorator = ( Story, { args } ) => {
	const city = ( args as SiteTimeZoneControls ).siteTimeZone;

	return (
		<SiteTimeZone city={ city }>
			{ /* Charts read the zone once per mount, so a change has to remount them. */ }
			<Story key={ city ?? SITE_TIME_ZONE_DEFAULT } />
		</SiteTimeZone>
	);
};
