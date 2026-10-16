/**
 * External dependencies
 */
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { parseSiteDateTime } from '../site-datetime';

const DEFAULTS = getSettings();

const siteIn = ( timeZone: string, offset: number ) =>
	setSettings( {
		...DEFAULTS,
		l10n: {
			...DEFAULTS.l10n,
			locale: `site-datetime-${ timeZone.replace( /\W/g, '-' ) }-${ offset }`,
		},
		timezone: { offset, offsetFormatted: String( offset ), string: timeZone, abbr: '' },
	} );

describe( 'parseSiteDateTime', () => {
	beforeEach( () => siteIn( 'Europe/Amsterdam', 2 ) );

	it( 'reads the wall time as belonging to the site timezone', () => {
		const date = parseSiteDateTime( '2026-07-09 09:42:57' );

		expect( date?.toISOString() ).toBe( '2026-07-09T07:42:57.000Z' );
	} );

	it( 'accepts a date with no time part', () => {
		const date = parseSiteDateTime( '2026-07-09' );

		expect( date?.toISOString() ).toBe( '2026-07-08T22:00:00.000Z' );
	} );

	it( 'preserves fractional seconds', () => {
		const date = parseSiteDateTime( '2026-07-09 09:42:57.123' );

		expect( date?.toISOString() ).toBe( '2026-07-09T07:42:57.123Z' );
	} );

	it( 'trusts an explicit offset instead of re-anchoring', () => {
		const date = parseSiteDateTime( '2026-06-29T00:00:00.000+02:00' );

		expect( date?.toISOString() ).toBe( '2026-06-28T22:00:00.000Z' );
	} );

	it( 'uses a manual site offset', () => {
		siteIn( '', 5.5 );
		const date = parseSiteDateTime( '2026-07-09 09:42:57' );

		expect( date?.toISOString() ).toBe( '2026-07-09T04:12:57.000Z' );
	} );

	it( 'anchors a Date instance to the site timezone, keeping its instant', () => {
		const source = new Date( '2026-06-29T12:00:00.000Z' );
		const date = parseSiteDateTime( source );

		expect( date?.getTime() ).toBe( source.getTime() );
		expect( date?.timeZone ).toBe( 'Europe/Amsterdam' );
		// The zone is what the plain input could not carry: 12:00 UTC is 14:00
		// on the site's clock, and a browser-zone read would name another hour.
		expect( date?.getHours() ).toBe( 14 );
	} );

	it( 'returns undefined for a malformed value', () => {
		expect( parseSiteDateTime( 'not a date' ) ).toBeUndefined();
	} );

	it( 'returns undefined for an empty value', () => {
		expect( parseSiteDateTime( '' ) ).toBeUndefined();
	} );

	it( 'returns undefined for an impossible date', () => {
		expect( parseSiteDateTime( '2026-13-45 00:00:00' ) ).toBeUndefined();
	} );
} );
