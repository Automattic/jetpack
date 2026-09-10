import { parseAsLocalDate } from '../utils/date-parsing';

// `@wordpress/jest-console` registers the matcher but ships no types for it.
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace jest {
		interface Matchers< R > {
			toHaveWarnedWith( ...args: unknown[] ): R;
		}
	}
}

// Every case asserts an absolute instant, so running the suite from more than one
// worker zone is what proves the result does not depend on the viewer's.
const CASES: Array< [ string, string, string ] > = [
	// The shape the Stats payload gives for a day bucket.
	[ '2026-08-02', 'Asia/Tokyo', '2026-08-01T15:00:00.000Z' ],
	[ '2026-08-02 09:30:00', 'Asia/Tokyo', '2026-08-02T00:30:00.000Z' ],
	[ '2026-08-02T09:30:00', 'Asia/Tokyo', '2026-08-02T00:30:00.000Z' ],
	// Santiago springs forward at midnight, deleting this reading entirely.
	[ '2026-09-06', 'America/Santiago', '2026-09-06T04:00:00.000Z' ],
	// Berlin's gap runs the other way, its offset growing rather than shrinking, which is
	// the shape most of Europe and North America has. Only this case tells the smaller of
	// the two candidate offsets apart from the later probe.
	[ '2026-03-29 02:30:00', 'Europe/Berlin', '2026-03-29T01:30:00.000Z' ],
	// And Santiago falls back at midnight, so this reading happens twice.
	[ '2026-04-04 23:00:00', 'America/Santiago', '2026-04-05T02:00:00.000Z' ],
	// Which of the two an overlap resolves to follows the sign of the offset, so a zone
	// east of UTC settles on the other one. Auckland is where this PR's own stories sit.
	[ '2026-04-05 02:30:00', 'Pacific/Auckland', '2026-04-04T14:30:00.000Z' ],
	// Hours past a fall-back, where the first offset probe lands on the wrong side
	// of the transition and only the second one is right.
	[ '2026-11-01 08:00:00', 'America/Los_Angeles', '2026-11-01T16:00:00.000Z' ],
	// Nothing about this reading is remarkable in Tokyo; it is the worker zones that make it
	// worth asserting, since Santiago deletes this local midnight and used to drag the
	// answer an hour with it.
	[ '2026-09-06', 'Asia/Tokyo', '2026-09-05T15:00:00.000Z' ],
	// date-fns reads each field as one to N digits, so an unpadded string must land on the
	// same instant as its padded twin. A one-digit fraction is 5ms to date-fns, not 500.
	[ '2026-8-2', 'Asia/Tokyo', '2026-08-01T15:00:00.000Z' ],
	[ '2026-08-02 9:30', 'Asia/Tokyo', '2026-08-02T00:30:00.000Z' ],
	[ '2026-08-02T9:30:5.5', 'Asia/Tokyo', '2026-08-02T00:30:05.005Z' ],
];

// A string carrying its own offset is already an instant, so the zone must not move it.
const INSTANT_CASES: Array< [ string, string ] > = [
	[ '2026-08-02T00:00:00Z', '2026-08-02T00:00:00.000Z' ],
	[ '2026-08-02T00:00:00+05:00', '2026-08-01T19:00:00.000Z' ],
];

/**
 * The zone-aware half of `parseAsLocalDate`, run from whatever zone the caller's
 * environment pins.
 */
export const describeZonedParsing = () => {
	describe( 'parseAsLocalDate with a time zone', () => {
		test.each( CASES )( 'reads %s in %s', ( dateString, timeZone, expected ) => {
			expect( parseAsLocalDate( dateString, timeZone ).toISOString() ).toBe( expected );
		} );

		test.each( INSTANT_CASES )( 'leaves %s where it is', ( dateString, expected ) => {
			expect( parseAsLocalDate( dateString, 'Asia/Tokyo' ).toISOString() ).toBe( expected );
		} );

		it( 'falls back to the runtime zone where Intl rejects the zone, and says so', () => {
			const fallback = parseAsLocalDate( '2026-08-02', 'Not/AZone' );

			expect( fallback.getTime() ).toBe( parseAsLocalDate( '2026-08-02' ).getTime() );
			expect( console ).toHaveWarnedWith(
				'[Charts] timeZone "Not/AZone" is not a zone Intl accepts, so dates are read in the browser\'s zone. Pass an IANA name or a UTC offset such as "+05:30".'
			);
		} );

		it( 'keeps a year below 100 out of the 1900s', () => {
			expect( parseAsLocalDate( '0099-08-02', 'Asia/Tokyo' ).getUTCFullYear() ).toBe( 99 );
			expect( parseAsLocalDate( '99-08-02', 'Asia/Tokyo' ).getUTCFullYear() ).toBe( 99 );
		} );

		it( 'reads a naive string in the runtime zone when no zone is supplied', () => {
			const local = parseAsLocalDate( '2026-08-02' );

			expect( [
				local.getFullYear(),
				local.getMonth(),
				local.getDate(),
				local.getHours(),
			] ).toEqual( [ 2026, 7, 2, 0 ] );
		} );
	} );
};
