/**
 * Internal dependencies
 */
import { bucketViewsByWeekday, pickPeakWeekday } from '../bucket-views-by-weekday';

// 2026-07-06 is a Monday, so a run starting here maps weekday index 0 → Monday.
function dailyRow( date: string, views: number ) {
	return {
		period: date,
		time_interval: date,
		date_start: `${ date }T00:00:00+00:00`,
		date_end: `${ date }T23:59:59+00:00`,
		label: date,
		value: views,
		views,
	};
}

describe( 'bucketViewsByWeekday', () => {
	it( 'always returns seven buckets, Monday first', () => {
		const buckets = bucketViewsByWeekday( [] );

		expect( buckets ).toHaveLength( 7 );
		expect( buckets.map( bucket => bucket.weekday ) ).toEqual( [ 0, 1, 2, 3, 4, 5, 6 ] );
		expect( buckets.every( bucket => bucket.occurrences === 0 ) ).toBe( true );
	} );

	it( 'assigns each date to its weekday', () => {
		const buckets = bucketViewsByWeekday( [
			dailyRow( '2026-07-06', 10 ), // Monday
			dailyRow( '2026-07-09', 40 ), // Thursday
			dailyRow( '2026-07-12', 5 ), // Sunday
		] );

		expect( buckets[ 0 ] ).toMatchObject( { total: 10, occurrences: 1, average: 10 } );
		expect( buckets[ 3 ] ).toMatchObject( { total: 40, occurrences: 1, average: 40 } );
		expect( buckets[ 6 ] ).toMatchObject( { total: 5, occurrences: 1, average: 5 } );
	} );

	it( 'averages over how many times each weekday actually occurred', () => {
		// Three Mondays, one Tuesday. Monday's total is larger, its average is not.
		const buckets = bucketViewsByWeekday( [
			dailyRow( '2026-07-06', 10 ),
			dailyRow( '2026-07-07', 25 ),
			dailyRow( '2026-07-13', 10 ),
			dailyRow( '2026-07-20', 10 ),
		] );

		expect( buckets[ 0 ] ).toMatchObject( { total: 30, occurrences: 3, average: 10 } );
		expect( buckets[ 1 ] ).toMatchObject( { total: 25, occurrences: 1, average: 25 } );
	} );

	it( 'reads the calendar date, not a UTC instant', () => {
		// `date_start` carries a nominal +00:00 that is a bucket label, not a real
		// instant. Parsing it as UTC would shift the day west of Greenwich and move
		// this row onto Sunday.
		const buckets = bucketViewsByWeekday( [ dailyRow( '2026-07-06', 10 ) ] );

		expect( buckets[ 0 ].occurrences ).toBe( 1 );
		expect( buckets[ 6 ].occurrences ).toBe( 0 );
	} );

	it( 'counts a zero-view day as an occurrence', () => {
		// Otherwise a weekday that reliably draws nothing would average as if it had
		// never happened, and could outrank a weekday with real traffic.
		const buckets = bucketViewsByWeekday( [
			dailyRow( '2026-07-06', 0 ),
			dailyRow( '2026-07-13', 10 ),
		] );

		expect( buckets[ 0 ] ).toMatchObject( { total: 10, occurrences: 2, average: 5 } );
	} );

	it( 'falls back to the row value when no views field is present', () => {
		const buckets = bucketViewsByWeekday( [
			{ time_interval: '2026-07-06', date_start: '2026-07-06T00:00:00+00:00', value: 12 },
		] );

		expect( buckets[ 0 ] ).toMatchObject( { total: 12, occurrences: 1 } );
	} );

	it( 'ignores rows with an unparseable date', () => {
		const buckets = bucketViewsByWeekday( [
			dailyRow( '2026-07-06', 10 ),
			{ time_interval: 'not-a-date', value: 999 },
		] );

		expect( buckets.reduce( ( sum, bucket ) => sum + bucket.total, 0 ) ).toBe( 10 );
	} );

	it( 'labels buckets with localized weekday names', () => {
		const buckets = bucketViewsByWeekday( [] );

		expect( buckets[ 0 ].label ).toBe( 'Monday' );
		expect( buckets[ 6 ].label ).toBe( 'Sunday' );
	} );
} );

describe( 'pickPeakWeekday', () => {
	it( 'picks the highest average, not the highest total', () => {
		// This is the whole point of averaging: a range that is not a whole number
		// of weeks samples some weekdays more often than others, and the extra
		// sample alone must not decide the winner.
		const buckets = bucketViewsByWeekday( [
			dailyRow( '2026-07-06', 10 ),
			dailyRow( '2026-07-13', 10 ),
			dailyRow( '2026-07-20', 10 ), // Monday total 30, average 10
			dailyRow( '2026-07-07', 25 ), // Tuesday total 25, average 25
		] );

		expect( pickPeakWeekday( buckets ) ).toMatchObject( { weekday: 1, average: 25 } );
	} );

	it( 'returns undefined when the covered days received no views', () => {
		const buckets = bucketViewsByWeekday( [ dailyRow( '2026-07-06', 0 ) ] );

		expect( pickPeakWeekday( buckets ) ).toBeUndefined();
	} );

	it( 'returns undefined when the range covers no days', () => {
		expect( pickPeakWeekday( bucketViewsByWeekday( [] ) ) ).toBeUndefined();
	} );

	it( 'breaks ties toward the earlier weekday', () => {
		const buckets = bucketViewsByWeekday( [
			dailyRow( '2026-07-08', 10 ), // Wednesday
			dailyRow( '2026-07-09', 10 ), // Thursday
		] );

		expect( pickPeakWeekday( buckets ) ).toMatchObject( { weekday: 2 } );
	} );
} );
