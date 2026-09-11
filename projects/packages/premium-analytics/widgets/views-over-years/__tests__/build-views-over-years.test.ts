/**
 * Internal dependencies
 */
import { buildViewsOverYearsRows, resolveMetric } from '../build-views-over-years';

// Month buckets the way the sanitizer labels them, including the zero months
// the endpoint pads back to the requested start.
const BUCKETS = [
	{ date: '2024-12-01', views: 0 },
	{ date: '2025-11-01', views: 300 },
	{ date: '2025-12-01', views: 620 },
	{ date: '2026-01-01', views: 155 },
	{ date: '2026-02-01', views: 0 },
	{ date: '2026-03-01', views: 450 },
];

// Mid-March: the current month has 15 days so far.
const TODAY = { year: 2026, month: 2, day: 15 };

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

	it( 'fills a silent year between two with views', () => {
		const rows = buildViewsOverYearsRows(
			[
				{ date: '2023-06-01', views: 9 },
				{ date: '2025-06-01', views: 9 },
			],
			'total',
			{ year: 2025, month: 5, day: 30 }
		);

		expect( rows.map( row => row.year ) ).toEqual( [ 2025, 2024, 2023 ] );
		expect( rows[ 1 ].months ).toEqual( Array( 12 ).fill( 0 ) );
		expect( rows[ 1 ].total ).toBe( 0 );
	} );

	it( 'sums buckets that land on the same month', () => {
		const rows = buildViewsOverYearsRows(
			[
				{ date: '2026-03', views: 4 },
				{ date: '2026-03-15', views: 6 },
			],
			'total',
			TODAY
		);

		expect( rows[ 0 ].months[ 2 ] ).toBe( 10 );
	} );

	it( 'returns nothing without a month of views', () => {
		expect( buildViewsOverYearsRows( [], 'total', TODAY ) ).toEqual( [] );
		expect(
			buildViewsOverYearsRows( [ { date: '2026-01-01', views: 0 } ], 'total', TODAY )
		).toEqual( [] );
		expect( buildViewsOverYearsRows( [ { date: 'never', views: 5 } ], 'total', TODAY ) ).toEqual(
			[]
		);
	} );
} );

describe( 'resolveMetric', () => {
	it( 'reads anything but average as the total', () => {
		expect( resolveMetric( 'average' ) ).toBe( 'average' );
		expect( resolveMetric( 'total' ) ).toBe( 'total' );
		expect( resolveMetric( undefined ) ).toBe( 'total' );
		expect( resolveMetric( 'median' ) ).toBe( 'total' );
	} );
} );
