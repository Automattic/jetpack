import { createDateFormatter, createZonedClock, sanitizeFormatting } from '../date-formatting';

// `@wordpress/jest-console` registers the matcher but ships no types for it.
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace jest {
		interface Matchers< R > {
			toHaveWarned(): R;
		}
	}
}

describe( 'createDateFormatter', () => {
	it( 'renders an invalid date rather than throwing', () => {
		const format = createDateFormatter(
			{ month: 'short', day: 'numeric' },
			{ locale: 'de-DE', timeZone: 'Asia/Tokyo' }
		);

		expect( format( NaN ) ).toBe( 'Invalid Date' );
		expect( format( new Date( 'nope' ) ) ).toBe( 'Invalid Date' );
	} );
} );

describe( 'createZonedClock', () => {
	it( 'reads calendar fields in the supplied zone', () => {
		// 00:30 on Aug 3 in Tokyo.
		expect( createZonedClock( 'Asia/Tokyo' )( new Date( '2026-08-02T15:30:00Z' ) ) ).toEqual( {
			month: 8,
			hour: 0,
		} );
	} );

	it.each( [
		[ 'with a zone', 'Asia/Tokyo' ],
		[ 'without one', undefined ],
	] )( 'answers NaN for an invalid date %s', ( _label, timeZone ) => {
		expect( createZonedClock( timeZone )( new Date( 'nope' ) ) ).toEqual( {
			month: NaN,
			hour: NaN,
		} );
	} );
} );

describe( 'sanitizeFormatting', () => {
	it( 'keeps a usable locale and zone', () => {
		const formatting = { locale: 'de-DE', timeZone: 'Asia/Tokyo' };

		expect( sanitizeFormatting( formatting ) ).toEqual( formatting );
	} );

	it( 'keeps a UTC offset, which a WordPress site may store instead of a zone name', () => {
		expect( sanitizeFormatting( { timeZone: '+05:30' } ) ).toEqual( {
			locale: undefined,
			timeZone: '+05:30',
		} );
	} );

	it( 'repairs the underscored locale WordPress reports', () => {
		expect( sanitizeFormatting( { locale: 'en_US', timeZone: 'Asia/Tokyo' } ) ).toEqual( {
			locale: 'en-US',
			timeZone: 'Asia/Tokyo',
		} );
	} );

	it( 'drops a locale no underscore swap can rescue, keeping the zone', () => {
		expect( sanitizeFormatting( { locale: 'nope!', timeZone: 'Asia/Tokyo' } ) ).toEqual( {
			locale: undefined,
			timeZone: 'Asia/Tokyo',
		} );
		expect( console ).toHaveWarned();
	} );

	it( 'drops the empty zone a site set to a manual offset reports, keeping the locale', () => {
		expect( sanitizeFormatting( { locale: 'de-DE', timeZone: '' } ) ).toEqual( {
			locale: 'de-DE',
			timeZone: undefined,
		} );
		expect( console ).toHaveWarned();
	} );

	it( 'drops both when neither is usable', () => {
		expect( sanitizeFormatting( { locale: '', timeZone: 'Mars/Olympus' } ) ).toEqual( {
			locale: undefined,
			timeZone: undefined,
		} );
		expect( console ).toHaveWarned();
	} );
} );
