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

/**
 * Put the site on a timezone, the way WordPress does at page load.
 *
 * @param string - IANA zone name, empty for offset-configured sites.
 * @param offset - Offset in hours.
 */
const siteOn = ( string: string, offset: number ) =>
	setSettings( {
		...DEFAULTS,
		timezone: { string, offset, offsetFormatted: String( offset ), abbr: '' },
	} );

/** The calendar day and clock time the value resolves to in its own zone. */
const wallTime = ( date: Date ) => format( date, "yyyy-MM-dd'T'HH:mm:ss.SSS" );

describe( 'localTZDate', () => {
	// These helpers read the site zone straight from the `@wordpress/date`
	// settings WordPress installs synchronously, so there is no core-data entity
	// to await and no window in which they answer in the visitor's zone.
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
