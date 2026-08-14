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
				{ label: 'Comparison', data: [] },
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

			const comparison = createSeries( 'Last Week', [
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

		it( 'handles weekly intervals with different start days', () => {
			// This is the key scenario: weeks that don't start on the same day
			// Primary: Sep 12 (Thu) - period starts mid-week
			// Comparison: Jun 14 (Sat) - period starts on different day
			const primary = createSeries( 'Current Period', [
				new Date( '2024-09-12' ), // Week 1 starts Thu
				new Date( '2024-09-16' ), // Week 2 starts Mon
				new Date( '2024-09-23' ), // Week 3
			] );

			const comparison = createSeries( 'Previous Period', [
				new Date( '2024-06-14' ), // Week 1 starts Sat
				new Date( '2024-06-17' ), // Week 2 starts Mon
				new Date( '2024-06-24' ), // Week 3
			] );

			const result = alignSeriesDates( [ primary, comparison ] );

			// Comparison should get primary's dates for perfect alignment
			expect( result[ 1 ].data[ 0 ].date ).toEqual( new Date( '2024-09-12' ) );
			expect( result[ 1 ].data[ 1 ].date ).toEqual( new Date( '2024-09-16' ) );
			expect( result[ 1 ].data[ 2 ].date ).toEqual( new Date( '2024-09-23' ) );

			// Original dates preserved for tooltip
			expect( result[ 1 ].data[ 0 ].realDate ).toEqual( new Date( '2024-06-14' ) );
		} );

		it( 'preserves original dates in realDate property', () => {
			const primary = createSeries( 'This Week', [
				new Date( '2024-01-08' ),
				new Date( '2024-01-09' ),
			] );

			const comparison = createSeries( 'Last Week', [
				new Date( '2024-01-01' ),
				new Date( '2024-01-02' ),
			] );

			const result = alignSeriesDates( [ primary, comparison ] );

			// Original dates preserved in realDate
			expect( result[ 1 ].data[ 0 ].realDate ).toEqual( new Date( '2024-01-01' ) );
			expect( result[ 1 ].data[ 1 ].realDate ).toEqual( new Date( '2024-01-02' ) );
		} );

		it( 'does not add realDate to primary series', () => {
			const primary = createSeries( 'This Week', [ new Date( '2024-01-08' ) ] );
			const comparison = createSeries( 'Last Week', [ new Date( '2024-01-01' ) ] );

			const result = alignSeriesDates( [ primary, comparison ] );

			expect( result[ 0 ].data[ 0 ] ).not.toHaveProperty( 'realDate' );
		} );

		it( 'returns series unchanged when dates already align', () => {
			const primary = createSeries( 'Series A', [
				new Date( '2024-01-01' ),
				new Date( '2024-01-02' ),
			] );

			const comparison = createSeries( 'Series B', [
				new Date( '2024-01-01' ), // Same start date
				new Date( '2024-01-02' ),
			] );

			const result = alignSeriesDates( [ primary, comparison ] );

			// When dates already align, comparison should be returned as-is
			expect( result[ 1 ] ).toBe( comparison );
		} );
	} );

	describe( 'series with different lengths', () => {
		it( 'handles comparison with more points than primary', () => {
			const primary = createSeries( 'Primary', [
				new Date( '2024-01-08' ),
				new Date( '2024-01-09' ),
			] );

			const comparison = createSeries( 'Comparison', [
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

			const comparison = createSeries( 'Comparison', [
				new Date( '2024-01-01' ),
				new Date( '2024-01-02' ),
			] );

			const result = alignSeriesDates( [ primary, comparison ] );

			// Both comparison points align to their corresponding primary dates
			expect( result[ 1 ].data[ 0 ].date ).toEqual( new Date( '2024-01-08' ) );
			expect( result[ 1 ].data[ 1 ].date ).toEqual( new Date( '2024-01-09' ) );
		} );
	} );

	describe( 'multiple comparison series', () => {
		it( 'aligns all comparison series to primary', () => {
			const primary = createSeries( 'Current', [
				new Date( '2024-03-01' ),
				new Date( '2024-03-02' ),
			] );

			const lastMonth = createSeries( 'Last Month', [
				new Date( '2024-02-01' ),
				new Date( '2024-02-02' ),
			] );

			const lastYear = createSeries( 'Last Year', [
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

			const comparison: ComparativeLineChartSeries = {
				label: 'Comparison',
				data: [
					{ date: new Date( '2024-01-01' ), value: 50 },
					{ date: new Date( '2024-01-02' ), value: 75 },
				],
			};

			const result = alignSeriesDates( [ primary, comparison ] );

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
					stroke: '#0000ff',
					seriesLineStyle: { opacity: 0.5 },
				},
			};

			const result = alignSeriesDates( [ primary, comparison ] );

			expect( result[ 1 ].label ).toBe( 'Comparison' );
			expect( result[ 1 ].options ).toEqual( {
				stroke: '#0000ff',
				seriesLineStyle: { opacity: 0.5 },
			} );
		} );
	} );
} );
