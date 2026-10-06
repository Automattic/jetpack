/**
 * Internal dependencies
 */
import { comparesYearAgo, getComparisonBucketShift, type BucketSpan } from '../year-ago-weeks';

const spans = ( ...ranges: Array< [ string, string ] > ): BucketSpan[] =>
	ranges.map( ( [ from, to ] ) => ( {
		date: new Date( `${ from }T00:00:00Z` ),
		endDate: new Date( `${ to }T23:59:59Z` ),
	} ) );

const CURRENT_FROM_MONDAY = spans(
	[ '2026-08-31', '2026-09-06' ],
	[ '2026-09-07', '2026-09-13' ],
	[ '2026-09-14', '2026-09-20' ]
);

describe( 'getComparisonBucketShift', () => {
	it.each( [
		[
			'skips the one-day week a Sunday-start comparison opens with',
			CURRENT_FROM_MONDAY,
			spans(
				[ '2025-08-31', '2025-08-31' ],
				[ '2025-09-01', '2025-09-07' ],
				[ '2025-09-08', '2025-09-14' ],
				[ '2025-09-15', '2025-09-20' ]
			),
			1,
		],
		[
			'skips it when the current period also ends on a one-day week',
			[ ...CURRENT_FROM_MONDAY, ...spans( [ '2026-09-21', '2026-09-21' ] ) ],
			spans(
				[ '2025-08-31', '2025-08-31' ],
				[ '2025-09-01', '2025-09-07' ],
				[ '2025-09-08', '2025-09-14' ],
				[ '2025-09-15', '2025-09-21' ]
			),
			1,
		],
		[
			'keeps an extra trailing week in place',
			spans( [ '2026-09-08', '2026-09-13' ], [ '2026-09-14', '2026-09-20' ] ),
			spans(
				[ '2026-08-12', '2026-08-16' ],
				[ '2026-08-17', '2026-08-23' ],
				[ '2026-08-24', '2026-08-24' ]
			),
			0,
		],
		[
			'pairs by index when both periods have as many buckets',
			CURRENT_FROM_MONDAY,
			spans(
				[ '2025-09-01', '2025-09-07' ],
				[ '2025-09-08', '2025-09-14' ],
				[ '2025-09-15', '2025-09-21' ]
			),
			0,
		],
	] )( '%s', ( _name, primary, comparison, expected ) => {
		expect( getComparisonBucketShift( primary, comparison ) ).toBe( expected );
	} );
} );

describe( 'comparesYearAgo', () => {
	it.each( [
		[
			'the same dates a year earlier',
			[ '2026-08-31T00:00:00.000+02:00', '2026-10-04T23:59:59.999+02:00' ],
			[ '2025-08-31T00:00:00.000+02:00', '2025-10-04T23:59:59.999+02:00' ],
			true,
		],
		[
			'a leap day against the day before it',
			[ '2028-02-10', '2028-02-29' ],
			[ '2027-02-09', '2027-02-28' ],
			true,
		],
		[
			'a range from the 1st ending on Feb 29 a year back',
			[ '2029-01-01', '2029-02-28' ],
			[ '2028-01-01', '2028-02-29' ],
			true,
		],
		[
			'the weekday-aligned year, 364 days earlier',
			[ '2026-09-01', '2026-10-04' ],
			[ '2025-09-02', '2025-10-05' ],
			false,
		],
		[
			'the previous 30 days',
			[ '2026-09-07', '2026-10-06' ],
			[ '2026-08-08', '2026-09-06' ],
			false,
		],
		[ 'no comparison', [ '2026-09-01', '2026-10-04' ], [ undefined, undefined ], false ],
	] )( '%s', ( _name, [ from, to ], [ compareFrom, compareTo ], expected ) => {
		expect(
			comparesYearAgo( { from, to, compare_from: compareFrom, compare_to: compareTo } )
		).toBe( expected );
	} );
} );
