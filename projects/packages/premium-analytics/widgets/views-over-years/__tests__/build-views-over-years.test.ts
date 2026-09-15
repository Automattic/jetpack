/**
 * Internal dependencies
 */
import { buildViewsOverYearsRows, type MonthBucket } from '../build-views-over-years';

const bucket = ( year: number, month: number, views: number ): MonthBucket => ( {
	month: { year, month },
	views,
} );

const BUCKETS = [
	bucket( 2024, 11, 0 ),
	bucket( 2025, 10, 300 ),
	bucket( 2025, 11, 620 ),
	bucket( 2026, 0, 155 ),
	bucket( 2026, 1, 0 ),
	bucket( 2026, 2, 450 ),
];

// Mid-March: the current month has 15 days so far.
const TODAY = new Date( 2026, 2, 15 );

describe( 'buildViewsOverYearsRows', () => {
	it( 'returns one row per year with views, newest first', () => {
		const rows = buildViewsOverYearsRows( BUCKETS, 'total', TODAY );

		expect( rows.map( row => row.year ) ).toEqual( [ 2026, 2025 ] );
	} );

	it( 'opens on the first month with views and closes on the current month', () => {
		const rows = buildViewsOverYearsRows( BUCKETS, 'total', TODAY );

		expect( rows[ 1 ].months ).toEqual( [
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			300,
			620,
		] );
		// February had no views: a zero, inside the covered span; April on is filler.
		expect( rows[ 0 ].months ).toEqual( [
			155,
			0,
			450,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
		] );
	} );

	it( 'totals each year over its covered months', () => {
		const rows = buildViewsOverYearsRows( BUCKETS, 'total', TODAY );

		expect( rows.map( row => row.total ) ).toEqual( [ 605, 920 ] );
	} );

	it( 'divides a month by its days under the average metric, the current month by the days so far', () => {
		const rows = buildViewsOverYearsRows( BUCKETS, 'average', TODAY );

		// November has 30 days, December 31; March is 15 days in.
		expect( rows[ 1 ].months.slice( 10 ) ).toEqual( [ 10, 20 ] );
		expect( rows[ 0 ].months.slice( 0, 3 ) ).toEqual( [ 5, 0, 30 ] );
		// The roll-up divides the year's views by the days it covers, not the
		// mean of its months: 920 / 61 and 605 / (31 + 28 + 15).
		expect( rows.map( row => row.total ) ).toEqual( [ 8, 15 ] );
	} );

	it( 'opens the first month on its first day under the average metric', () => {
		// First views on Nov 24: November covers 7 days, so 300 / 7 rather than 300 / 30.
		const rows = buildViewsOverYearsRows( BUCKETS, 'average', TODAY, new Date( 2025, 10, 24 ) );

		expect( rows[ 1 ].months.slice( 10 ) ).toEqual( [ 43, 20 ] );
		// The first year's roll-up covers 7 + 31 days; later years are untouched.
		expect( rows.map( row => row.total ) ).toEqual( [ 8, 24 ] );
	} );

	it( 'leaves the totals alone whatever the first day', () => {
		const rows = buildViewsOverYearsRows( BUCKETS, 'total', TODAY, new Date( 2025, 10, 24 ) );

		expect( rows[ 1 ].months.slice( 10 ) ).toEqual( [ 300, 620 ] );
		expect( rows.map( row => row.total ) ).toEqual( [ 605, 920 ] );
	} );

	it( 'divides the first month whole when the first day falls outside it', () => {
		const later = buildViewsOverYearsRows( BUCKETS, 'average', TODAY, new Date( 2025, 11, 5 ) );
		const earlier = buildViewsOverYearsRows( BUCKETS, 'average', TODAY, new Date( 2025, 9, 5 ) );

		expect( later[ 1 ].months.slice( 10 ) ).toEqual( [ 10, 20 ] );
		expect( earlier[ 1 ].months.slice( 10 ) ).toEqual( [ 10, 20 ] );
	} );

	it( 'counts a first day in the current month up to today', () => {
		const rows = buildViewsOverYearsRows(
			[ bucket( 2026, 2, 42 ) ],
			'average',
			TODAY,
			new Date( 2026, 2, 9 )
		);

		// March 9 through March 15: 42 / 7.
		expect( rows[ 0 ].months[ 2 ] ).toBe( 6 );
		expect( rows[ 0 ].total ).toBe( 6 );
	} );

	it( 'keeps a bucket after today rather than hiding its views', () => {
		const rows = buildViewsOverYearsRows( [ ...BUCKETS, bucket( 2026, 3, 999 ) ], 'total', TODAY );

		expect( rows[ 0 ].months.slice( 2, 5 ) ).toEqual( [ 450, 999, null ] );
		expect( rows[ 0 ].total ).toBe( 1604 );
	} );

	it( 'divides the current month by one day on the first', () => {
		const rows = buildViewsOverYearsRows(
			[ bucket( 2026, 2, 42 ) ],
			'average',
			new Date( 2026, 2, 1 )
		);

		expect( rows[ 0 ].months[ 2 ] ).toBe( 42 );
		expect( rows[ 0 ].total ).toBe( 42 );
	} );

	it( 'fills a silent year between two with views', () => {
		const rows = buildViewsOverYearsRows(
			[ bucket( 2023, 5, 9 ), bucket( 2025, 5, 9 ) ],
			'total',
			new Date( 2025, 5, 30 )
		);

		expect( rows.map( row => row.year ) ).toEqual( [ 2025, 2024, 2023 ] );
		expect( rows[ 1 ].months ).toEqual( Array( 12 ).fill( 0 ) );
		expect( rows[ 1 ].total ).toBe( 0 );
	} );

	it( 'returns nothing without a month of views', () => {
		expect( buildViewsOverYearsRows( [], 'total', TODAY ) ).toEqual( [] );
		expect( buildViewsOverYearsRows( [ bucket( 2026, 0, 0 ) ], 'total', TODAY ) ).toEqual( [] );
	} );
} );
