/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
import { format } from 'date-fns';
/**
 * Internal dependencies
 */
import { dateToISOStringWithLocalTZ, localTZDate, reportingTimeZone } from '../reporting-time-zone';

/** The package defaults before tests override them. */
const DEFAULTS = getSettings();

const siteOn = ( timezone: { offset: number; string: string } ) =>
	setSettings( {
		...DEFAULTS,
		timezone: { ...timezone, offsetFormatted: String( timezone.offset ), abbr: '' },
	} );

const wallTime = ( date: Date ) => format( date, "yyyy-MM-dd'T'HH:mm:ss.SSS" );

describe( 'reportingTimeZone', () => {
	it( 'reports in the site timezone', () => {
		siteOn( { offset: 9, string: 'Asia/Tokyo' } );

		expect( reportingTimeZone() ).toBe( 'Asia/Tokyo' );
	} );

	it( 'reports in the site offset when the site has no named zone', () => {
		siteOn( { offset: 5.5, string: '' } );

		expect( reportingTimeZone() ).toBe( '+05:30' );
	} );
} );

describe( 'localTZDate', () => {
	it( 'reads a date-only value as site midnight, west of Greenwich', () => {
		siteOn( { offset: -4, string: 'America/New_York' } );

		expect( wallTime( localTZDate( '2026-06-29' ) ) ).toBe( '2026-06-29T00:00:00.000' );
	} );

	it( 'reads a date-only value as site midnight, east of Greenwich', () => {
		siteOn( { offset: 2, string: 'Europe/Amsterdam' } );

		expect( wallTime( localTZDate( '2026-06-29' ) ) ).toBe( '2026-06-29T00:00:00.000' );
	} );

	it( 'honours a site configured with a manual offset', () => {
		siteOn( { offset: 5.5, string: '' } );

		expect( dateToISOStringWithLocalTZ( localTZDate( '2026-06-29' ) ) ).toBe(
			'2026-06-29T00:00:00.000+05:30'
		);
	} );

	it( 'lets an explicit timezone override the site', () => {
		siteOn( { offset: -4, string: 'America/New_York' } );

		expect( localTZDate( '2026-06-29', '+00:00' ).toISOString() ).toBe(
			'2026-06-29T00:00:00.000Z'
		);
	} );
} );
