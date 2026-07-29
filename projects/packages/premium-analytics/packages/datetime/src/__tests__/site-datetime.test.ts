/**
 * Internal dependencies
 */
import { parseSiteDateTime } from '../site-datetime';

describe( 'parseSiteDateTime', () => {
	// The Stats API returns MySQL datetimes with no offset, already expressed in
	// the site's timezone. Reading one as browser-local time shifts the calendar
	// day for any visitor whose zone differs from the site's.
	it( 'reads the wall time as belonging to the site timezone', () => {
		const date = parseSiteDateTime( '2026-07-09 09:42:57', 'Europe/Amsterdam' );

		// 09:42 in Amsterdam (UTC+2 in July) is 07:42 UTC.
		expect( date?.toISOString() ).toBe( '2026-07-09T07:42:57.000Z' );
	} );

	it( 'keeps the site-timezone calendar day regardless of the machine timezone', () => {
		const date = parseSiteDateTime( '2026-07-09 23:30:00', 'Asia/Taipei' );

		// 23:30 in Taipei (UTC+8) is 15:30 UTC on the same day.
		expect( date?.toISOString() ).toBe( '2026-07-09T15:30:00.000Z' );
	} );

	it( 'accepts a date with no time part', () => {
		const date = parseSiteDateTime( '2026-07-09', 'UTC' );

		expect( date?.toISOString() ).toBe( '2026-07-09T00:00:00.000Z' );
	} );

	it( 'accepts the ISO "T" separator', () => {
		const date = parseSiteDateTime( '2026-07-09T09:42:57', 'UTC' );

		expect( date?.toISOString() ).toBe( '2026-07-09T09:42:57.000Z' );
	} );

	it( 'returns undefined for a malformed value', () => {
		expect( parseSiteDateTime( 'not a date', 'UTC' ) ).toBeUndefined();
	} );

	it( 'returns undefined for an empty value', () => {
		expect( parseSiteDateTime( '', 'UTC' ) ).toBeUndefined();
	} );

	it( 'returns undefined for an impossible date', () => {
		expect( parseSiteDateTime( '2026-13-45 00:00:00', 'UTC' ) ).toBeUndefined();
	} );
} );
