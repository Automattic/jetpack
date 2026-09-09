import { parseAsLocalDate } from '../utils/date-parsing';

// Every case asserts an absolute instant, so running the suite from more than one
// worker zone is what proves the result does not depend on the viewer's.
const CASES: Array< [ string, string, string ] > = [
	// The shape the Stats payload gives for a day bucket.
	[ '2026-08-02', 'Asia/Tokyo', '2026-08-01T15:00:00.000Z' ],
	[ '2026-08-02 09:30:00', 'Asia/Tokyo', '2026-08-02T00:30:00.000Z' ],
	[ '2026-08-02T09:30:00', 'Asia/Tokyo', '2026-08-02T00:30:00.000Z' ],
	// Santiago springs forward at midnight, deleting this reading entirely.
	[ '2026-09-06', 'America/Santiago', '2026-09-06T04:00:00.000Z' ],
	// And falls back at midnight, so this one happens twice; the first wins.
	[ '2026-04-04 23:00:00', 'America/Santiago', '2026-04-05T02:00:00.000Z' ],
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

		it( 'falls back to the runtime zone where Intl rejects the zone', () => {
			const fallback = parseAsLocalDate( '2026-08-02', 'Not/AZone' );

			expect( fallback.getTime() ).toBe( parseAsLocalDate( '2026-08-02' ).getTime() );
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
