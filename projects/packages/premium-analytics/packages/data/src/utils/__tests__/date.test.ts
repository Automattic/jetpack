/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
import { format } from 'date-fns';
/**
 * Internal dependencies
 */
import { dateToISOStringWithLocalTZ, formatToTimezoneNaiveString, localTZDate } from '../date';

const DEFAULTS = getSettings();

const siteOn = ( string: string, offset: number ) =>
	setSettings( {
		...DEFAULTS,
		timezone: { string, offset, offsetFormatted: String( offset ), abbr: '' },
	} );

const wallTime = ( date: Date ) => format( date, "yyyy-MM-dd'T'HH:mm:ss.SSS" );

describe( 'localTZDate', () => {
	it( 'reads a date-only value as site midnight, west of Greenwich', () => {
		siteOn( 'America/New_York', -4 );

		expect( wallTime( localTZDate( '2026-06-29' ) ) ).toBe( '2026-06-29T00:00:00.000' );
	} );

	it( 'reads a date-only value as site midnight, east of Greenwich', () => {
		siteOn( 'Europe/Amsterdam', 2 );

		expect( wallTime( localTZDate( '2026-06-29' ) ) ).toBe( '2026-06-29T00:00:00.000' );
	} );

	it( 'honours a site configured with a manual offset', () => {
		siteOn( '', 5.5 );

		expect( dateToISOStringWithLocalTZ( localTZDate( '2026-06-29' ) ) ).toBe(
			'2026-06-29T00:00:00.000+05:30'
		);
	} );

	it( 'lets an explicit timezone override the site', () => {
		siteOn( 'America/New_York', -4 );

		expect( localTZDate( '2026-06-29', '+00:00' ).toISOString() ).toBe(
			'2026-06-29T00:00:00.000Z'
		);
	} );

	it( 'formats a naive string in the site zone', () => {
		siteOn( 'America/New_York', -4 );

		expect( formatToTimezoneNaiveString( localTZDate( '2026-06-29T13:30:00Z' ) ) ).toBe(
			'2026-06-29T09:30:00.000'
		);
	} );
} );
