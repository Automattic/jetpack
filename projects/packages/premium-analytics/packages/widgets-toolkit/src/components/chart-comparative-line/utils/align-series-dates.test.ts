/**
 * External dependencies
 */
import { toLocalTZ } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { alignSeriesDates } from './align-series-dates';
import type { ComparativeLineChartSeries } from '../types';

/**
 * Helper to create a series with dates.
 */
function createSeries(
	label: string,
	dates: Date[],
	values?: number[]
): ComparativeLineChartSeries {
	return {
		label,
		data: dates.map( ( date, i ) => ( {
			date,
			value: values?.[ i ] ?? i * 10,
		} ) ),
	};
}

/**
 * Helper to create a previous-period series — the only kind that gets re-dated.
 */
function createComparison(
	label: string,
	dates: Date[],
	values?: number[]
): ComparativeLineChartSeries {
	return { ...createSeries( label, dates, values ), options: { type: 'comparison' } };
}

describe( 'alignSeriesDates', () => {
	describe( 'edge cases', () => {
		it( 'returns empty array as-is', () => {
			const result = alignSeriesDates( [] );
			expect( result ).toEqual( [] );
		} );

		it( 'returns single series unchanged', () => {
			const series = [
				createSeries( 'Primary', [ new Date( '2024-01-01' ), new Date( '2024-01-02' ) ] ),
			];

			const result = alignSeriesDates( series );

			expect( result ).toBe( series ); // Same reference
			expect( result[ 0 ].data[ 0 ].date ).toEqual( new Date( '2024-01-01' ) );
		} );

		it( 'handles series with empty data arrays', () => {
			const series: ComparativeLineChartSeries[] = [
				{ label: 'Primary', data: [] },
				{ label: 'Comparison', data: [], options: { type: 'comparison' } },
			];

			const result = alignSeriesDates( series );

			expect( result ).toBe( series ); // Returns original when primary has no data
		} );

		it( 'handles comparison series with empty data', () => {
			const primary = createSeries( 'Primary', [
				new Date( '2024-01-01' ),
				new Date( '2024-01-02' ),
			] );
			const comparison: ComparativeLineChartSeries = {
				label: 'Comparison',
				data: [],
				options: { type: 'comparison' },
			};

			const result = alignSeriesDates( [ primary, comparison ] );

			expect( result[ 0 ] ).toBe( primary ); // Primary unchanged
			expect( result[ 1 ] ).toBe( comparison ); // Empty comparison returned as-is
		} );
	} );

	describe( 'index-based date alignment', () => {
		it( 'aligns comparison dates to corresponding primary dates by index', () => {
			const primary = createSeries( 'This Week', [
				new Date( '2024-01-08' ), // Monday of this week
				new Date( '2024-01-09' ),
				new Date( '2024-01-10' ),
			] );

			const comparison = createComparison( 'Last Week', [
				new Date( '2024-01-01' ), // Monday of last week
				new Date( '2024-01-02' ),
				new Date( '2024-01-03' ),
			] );

			const result = alignSeriesDates( [ primary, comparison ] );

			// Primary should be unchanged
			expect( result[ 0 ].data[ 0 ].date ).toEqual( new Date( '2024-01-08' ) );

			// Comparison dates should match primary dates by index
			expect( result[ 1 ].data[ 0 ].date ).toEqual( new Date( '2024-01-08' ) );
			expect( result[ 1 ].data[ 1 ].date ).toEqual( new Date( '2024-01-09' ) );
			expect( result[ 1 ].data[ 2 ].date ).toEqual( new Date( '2024-01-10' ) );
		} );

		it( 'leaves a second current-period series where it is', () => {
			const views = createSeries( 'Views', [ new Date( '2024-01-08' ), new Date( '2024-01-09' ) ] );
			// A paired metric is not a comparison: its dates are its own, and
			// re-dating them onto the first series would silently move the points.
			const visitors = createSeries( 'Visitors', [
				new Date( '2024-01-01' ),
				new Date( '2024-01-02' ),
			] );

			const result = alignSeriesDates( [ views, visitors ] );

			expect( result[ 1 ] ).toBe( visitors );
			expect( result[ 1 ].data[ 0 ].date ).toEqual( new Date( '2024-01-01' ) );
			expect( result[ 1 ].data[ 0 ] ).not.toHaveProperty( 'realDate' );
		} );

		it( "aligns each comparison to its group's current period", () => {
			const views = {
				...createSeries( 'Views', [ new Date( '2024-01-08' ), new Date( '2024-01-09' ) ] ),
				group: 'views',
			};
			const previousViews = {
				...createComparison( 'Previous views', [
					new Date( '2024-01-01' ),
					new Date( '2024-01-02' ),
				] ),
				group: 'views',
			};
			const visitors = {
				...createSeries( 'Visitors', [ new Date( '2024-02-08' ), new Date( '2024-02-09' ) ] ),
				group: 'visitors',
			};
			const previousVisitors = {
				...createComparison( 'Previous visitors', [
					new Date( '2024-02-01' ),
					new Date( '2024-02-02' ),
				] ),
				group: 'visitors',
			};

			const result = alignSeriesDates( [ views, previousViews, visitors, previousVisitors ] );

			expect( result[ 1 ].data.map( point => point.date ) ).toEqual(
				views.data.map( point => point.date )
			);
			expect( result[ 3 ].data.map( point => point.date ) ).toEqual(
				visitors.data.map( point => point.date )
			);
		} );

		it( 'returns series unchanged when dates already align', () => {
			const primary = createSeries( 'Series A', [
				new Date( '2024-01-01' ),
				new Date( '2024-01-02' ),
			] );

			const comparison = createComparison( 'Series B', [
				new Date( '2024-01-01' ), // Same start date
				new Date( '2024-01-02' ),
			] );

			const result = alignSeriesDates( [ primary, comparison ] );

			// When dates already align, comparison should be returned as-is
			expect( result[ 1 ] ).toBe( comparison );
		} );

		it( 'leaves a comparison its producer already placed where it is', () => {
			const primary = createSeries( 'Series A', [
				new Date( '2024-01-01' ),
				new Date( '2024-01-02' ),
			] );
			const comparison = {
				...createComparison( 'Series B', [ new Date( '2024-01-02' ) ] ),
				aligned: true,
			};

			expect( alignSeriesDates( [ primary, comparison ] )[ 1 ] ).toBe( comparison );
		} );
	} );

	describe( 'series with different lengths', () => {
		it( 'handles comparison with more points than primary', () => {
			const primary = createSeries( 'Primary', [
				new Date( '2024-01-08' ),
				new Date( '2024-01-09' ),
			] );

			const comparison = createComparison( 'Comparison', [
				new Date( '2024-01-01' ),
				new Date( '2024-01-02' ),
				new Date( '2024-01-03' ), // Extra point
			] );

			const result = alignSeriesDates( [ primary, comparison ] );

			// First two points align by index
			expect( result[ 1 ].data[ 0 ].date ).toEqual( new Date( '2024-01-08' ) );
			expect( result[ 1 ].data[ 1 ].date ).toEqual( new Date( '2024-01-09' ) );
			// Extra point gets last primary date
			expect( result[ 1 ].data[ 2 ].date ).toEqual( new Date( '2024-01-09' ) );
		} );

		it( 'handles comparison with fewer points than primary', () => {
			const primary = createSeries( 'Primary', [
				new Date( '2024-01-08' ),
				new Date( '2024-01-09' ),
				new Date( '2024-01-10' ),
			] );

			const comparison = createComparison( 'Comparison', [
				new Date( '2024-01-01' ),
				new Date( '2024-01-02' ),
			] );

			const result = alignSeriesDates( [ primary, comparison ] );

			expect( result[ 1 ].data.map( point => point.date ) ).toEqual( [
				new Date( '2024-01-08' ),
				new Date( '2024-01-09' ),
			] );
		} );
	} );

	describe( 'multiple comparison series', () => {
		it( 'aligns all comparison series to primary', () => {
			const primary = createSeries( 'Current', [
				new Date( '2024-03-01' ),
				new Date( '2024-03-02' ),
			] );

			const lastMonth = createComparison( 'Last Month', [
				new Date( '2024-02-01' ),
				new Date( '2024-02-02' ),
			] );

			const lastYear = createComparison( 'Last Year', [
				new Date( '2023-03-01' ),
				new Date( '2023-03-02' ),
			] );

			const result = alignSeriesDates( [ primary, lastMonth, lastYear ] );

			// All series should now use primary's dates
			expect( result[ 0 ].data[ 0 ].date ).toEqual( new Date( '2024-03-01' ) );
			expect( result[ 1 ].data[ 0 ].date ).toEqual( new Date( '2024-03-01' ) );
			expect( result[ 2 ].data[ 0 ].date ).toEqual( new Date( '2024-03-01' ) );

			// Original dates preserved
			expect( result[ 1 ].data[ 0 ].realDate ).toEqual( new Date( '2024-02-01' ) );
			expect( result[ 2 ].data[ 0 ].realDate ).toEqual( new Date( '2023-03-01' ) );
		} );
	} );

	describe( 'data preservation', () => {
		it( 'preserves all other data point properties', () => {
			const primary: ComparativeLineChartSeries = {
				label: 'Primary',
				data: [
					{ date: new Date( '2024-01-08' ), value: 100 },
					{ date: new Date( '2024-01-09' ), value: 200 },
				],
			};

			const comparison = createComparison(
				'Comparison',
				[ new Date( '2024-01-01' ), new Date( '2024-01-02' ) ],
				[ 50, 75 ]
			);
			comparison.data[ 0 ].endDate = new Date( '2024-01-01T23:59:59Z' );

			const result = alignSeriesDates( [ primary, comparison ] );

			expect( result[ 1 ] ).not.toBe( comparison );
			expect( result[ 1 ].data[ 0 ].date ).toEqual( new Date( '2024-01-08' ) );
			expect( result[ 1 ].data[ 0 ].realDate ).toEqual( new Date( '2024-01-01' ) );
			expect( result[ 1 ].data[ 0 ].endDate ).toEqual( new Date( '2024-01-01T23:59:59Z' ) );
			// Values should be preserved
			expect( result[ 1 ].data[ 0 ].value ).toBe( 50 );
			expect( result[ 1 ].data[ 1 ].value ).toBe( 75 );
		} );

		it( 'preserves series options and other properties', () => {
			const primary: ComparativeLineChartSeries = {
				label: 'Primary',
				data: [ { date: new Date( '2024-01-08' ), value: 100 } ],
				options: { stroke: '#ff0000' },
			};

			const comparison: ComparativeLineChartSeries = {
				label: 'Comparison',
				data: [ { date: new Date( '2024-01-01' ), value: 50 } ],
				options: {
					type: 'comparison',
					stroke: '#0000ff',
					seriesLineStyle: { opacity: 0.5 },
				},
			};

			const result = alignSeriesDates( [ primary, comparison ] );

			expect( result[ 1 ] ).not.toBe( comparison );
			expect( result[ 1 ].label ).toBe( 'Comparison' );
			expect( result[ 1 ].options ).toEqual( {
				type: 'comparison',
				stroke: '#0000ff',
				seriesLineStyle: { opacity: 0.5 },
			} );
		} );
	} );

	describe( 'hourly series across a daylight saving switch', () => {
		// Hourly New York buckets from `start`, as the charts get them, minus the instants in `skip`.
		const hours = ( start: string, count: number, skip: string[] = [] ) =>
			Array.from( { length: count }, ( _, i ) =>
				toLocalTZ( new Date( start ).getTime() + i * 3600000, 'America/New_York' )
			).filter( date => ! skip.includes( date.toISOString() ) );

		const pairOf = ( result: ComparativeLineChartSeries[], realDate: string ) =>
			result[ 1 ].data
				.find( point => point.realDate?.toISOString() === realDate )
				?.date.toISOString();

		it( 'pairs a spring-forward day with the previous day by clock time', () => {
			// Mar 8, 2026 has no 2 AM, so 23 buckets from midnight EST.
			const primary = createSeries( 'Mar 8', hours( '2026-03-08T05:00:00Z', 23 ) );
			const comparison = createComparison( 'Mar 7', hours( '2026-03-07T05:00:00Z', 24 ) );

			const result = alignSeriesDates( [ primary, comparison ] );

			// Mar 7 3 AM EST sits on Mar 8 3 AM EDT, and Mar 7 2 AM has no slot.
			expect( pairOf( result, '2026-03-07T08:00:00.000Z' ) ).toBe( '2026-03-08T07:00:00.000Z' );
			expect( pairOf( result, '2026-03-07T07:00:00.000Z' ) ).toBeUndefined();
			expect( result[ 1 ].data ).toHaveLength( 23 );
		} );

		it( 'pairs a 24-hour window crossing the fall-back hour by clock time', () => {
			// Nov 1 12 PM EDT to Nov 2 10 AM EST, with the repeated 1 AM merged into one bucket.
			const primary = createSeries(
				'Last 24 hours',
				hours( '2025-11-01T16:00:00Z', 24, [ '2025-11-02T06:00:00.000Z' ] )
			);
			const comparison = createComparison( 'Previous', hours( '2025-10-31T16:00:00Z', 24 ) );

			const result = alignSeriesDates( [ primary, comparison ] );

			expect( pairOf( result, '2025-11-01T14:00:00.000Z' ) ).toBe( '2025-11-02T15:00:00.000Z' );
			expect( pairOf( result, '2025-11-01T06:00:00.000Z' ) ).toBe( '2025-11-02T07:00:00.000Z' );
			expect( pairOf( result, '2025-11-01T15:00:00.000Z' ) ).toBeUndefined();
		} );

		it( 'pairs by clock time when the switch falls in the comparison window', () => {
			// Last 24 hours on Mar 9 at 10 AM: the comparison, 24 real hours back, starts at 10 AM EST.
			const primary = createSeries( 'Last 24 hours', hours( '2026-03-08T15:00:00Z', 24 ) );
			const comparison = createComparison( 'Previous', hours( '2026-03-07T15:00:00Z', 24 ) );

			const result = alignSeriesDates( [ primary, comparison ] );

			expect( pairOf( result, '2026-03-08T07:00:00.000Z' ) ).toBe( '2026-03-09T07:00:00.000Z' );
			expect( pairOf( result, '2026-03-08T14:00:00.000Z' ) ).toBe( '2026-03-09T14:00:00.000Z' );
			expect( pairOf( result, '2026-03-07T15:00:00.000Z' ) ).toBeUndefined();
		} );

		// Keyboard navigation reads every series at the same index.
		it( 'keeps the comparison on the current indexes, with an empty point for a missing hour', () => {
			const primary = createSeries( 'Last 24 hours', hours( '2026-03-08T15:00:00Z', 24 ) );
			const comparison = createComparison( 'Previous', hours( '2026-03-07T15:00:00Z', 24 ) );

			const result = alignSeriesDates( [ primary, comparison ] );

			const isoDates = ( s: ComparativeLineChartSeries ) =>
				s.data.map( point => point.date.toISOString() );
			expect( isoDates( result[ 1 ] ) ).toEqual( isoDates( primary ) );
			// Mar 8 has no 2 AM to sit on Mar 9 2 AM EDT.
			expect(
				result[ 1 ].data.find( point => point.date.toISOString() === '2026-03-09T06:00:00.000Z' )
			).toEqual( { date: primary.data[ 15 ].date, value: null } );
		} );
	} );
} );
