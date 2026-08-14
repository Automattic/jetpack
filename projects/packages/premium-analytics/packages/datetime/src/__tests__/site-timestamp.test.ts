/**
 * Internal dependencies
 */
import { parseSiteDateTime } from '../site-datetime';
import { readSiteTimestamp } from '../site-timestamp';
import { toLocalTZ } from '../tz';

describe( 'readSiteTimestamp', () => {
	it( 'reads the parts of a date-only value', () => {
		expect( readSiteTimestamp( '2026-06-29' ) ).toEqual( {
			value: '2026-06-29',
			parts: [ 2026, 5, 29, 0, 0, 0, 0 ],
			offset: undefined,
			isValid: true,
		} );
	} );

	it( 'trims surrounding whitespace', () => {
		expect( readSiteTimestamp( ' 2026-06-29 ' )?.value ).toBe( '2026-06-29' );
	} );

	it( 'reports the stated offset', () => {
		expect( readSiteTimestamp( '2026-06-29T00:00:00.000+02:00' )?.offset ).toBe( '+02:00' );
		expect( readSiteTimestamp( '2026-06-29T00:00:00Z' )?.offset ).toBe( 'Z' );
	} );

	it( 'pads a truncated millisecond field and truncates a longer one', () => {
		expect( readSiteTimestamp( '2026-06-29T00:00:00.5' )?.parts[ 6 ] ).toBe( 500 );
		expect( readSiteTimestamp( '2026-06-29T00:00:00.123456' )?.parts[ 6 ] ).toBe( 123 );
	} );

	it( 'returns null for a value in another format', () => {
		expect( readSiteTimestamp( 'not a date' ) ).toBeNull();
		expect( readSiteTimestamp( '' ) ).toBeNull();
	} );

	it.each( [ '2026-02-31', '2026-02-31T00:00:00Z', '2026-13-01', '2026-06-29T24:00:00Z' ] )(
		'marks %s invalid whether or not it states an offset',
		value => {
			expect( readSiteTimestamp( value )?.isValid ).toBe( false );
		}
	);

	it( 'accepts a leap day', () => {
		expect( readSiteTimestamp( '2024-02-29' )?.isValid ).toBe( true );
	} );

	it.each( [
		'2026-06-29T00:00:00+24:00',
		'2026-06-29T00:00:00-24:00',
		'2026-06-29T00:00:00+23:60',
		'2026-06-29T00:00:00+2360',
	] )( 'marks the out-of-range offset in %s invalid', value => {
		expect( readSiteTimestamp( value )?.isValid ).toBe( false );
	} );

	it( 'accepts an offset at the edge of the range', () => {
		expect( readSiteTimestamp( '2026-06-29T00:00:00+23:59' )?.isValid ).toBe( true );
		expect( readSiteTimestamp( '2026-06-29T00:00:00-2359' )?.isValid ).toBe( true );
	} );
} );

// Both entry points decide what is parseable from `readSiteTimestamp`, so a
// value accepted by one can never be rejected by the other.
describe( 'parity between toLocalTZ and parseSiteDateTime', () => {
	it.each( [
		[ '2026-06-29', true ],
		[ ' 2026-06-29 ', true ],
		[ '2026-07-09 09:42:57', true ],
		[ '2026-07-09T09:42:57.123', true ],
		[ '2026-06-29T00:00:00Z', true ],
		[ '2026-06-29T00:00:00.000+02:00', true ],
		[ '2024-02-29', true ],
		[ '', false ],
		[ 'not a date', false ],
		[ '2026-02-31', false ],
		[ '2026-02-31T00:00:00Z', false ],
		[ '2026-13-45 00:00:00', false ],
		[ '2026-06-29T12:60:00', false ],
		[ '2026-06-29T24:00:00Z', false ],
		[ '2026/06/29', false ],
		[ '06/29/2026', false ],
		[ 'June 29, 2026', false ],
		[ '2026-6-9', false ],
		[ '2026-06-29T00:00:00+24:00', false ],
		[ '2026-06-29T00:00:00+23:60', false ],
	] )( 'both %s treat as parseable: %s', ( value, isParseable ) => {
		expect( ! isNaN( toLocalTZ( value as string, '+00:00' ).getTime() ) ).toBe( isParseable );
		expect( parseSiteDateTime( value ) !== undefined ).toBe( isParseable );
	} );
} );
