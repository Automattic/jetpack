/**
 * Internal dependencies
 */
import { granularitiesForRange } from '../granularities-for-range';
import type { ReportParams } from '@jetpack-premium-analytics/data';

const CHART_PERIODS = [ 'hour', 'day', 'week', 'month' ] as const;

function params( from: string, to: string, interval: string, preset?: string ): ReportParams {
	return { from, to, interval, preset } as ReportParams;
}

describe( 'granularitiesForRange', () => {
	it( 'keeps only the buckets the range can fill, in the chart order', () => {
		// A 30-day range allows days and weeks; the chart also draws hours and
		// months, which this range has no use for.
		expect(
			granularitiesForRange( CHART_PERIODS, params( '2026-06-01', '2026-06-30', 'day' ) )
		).toEqual( [ 'day', 'week' ] );
	} );

	it( 'orders by the chart, not by the range default', () => {
		// A short range names `day` first as its default, but the chart lists
		// finest first — the control must not reorder itself per range.
		expect(
			granularitiesForRange( CHART_PERIODS, params( '2026-06-01', '2026-06-03', 'day' ) )
		).toEqual( [ 'hour', 'day' ] );
	} );

	it( 'narrows to one bucket where the range allows one', () => {
		expect(
			granularitiesForRange(
				CHART_PERIODS,
				params( '2026-06-15T00:00:00+00:00', '2026-06-15T23:59:59+00:00', 'hour' )
			)
		).toEqual( [ 'hour' ] );
	} );

	it( 'drops a range bucket the chart cannot draw', () => {
		// Past a year the range allows months and quarters; the chart has no
		// quarter, so only the month survives.
		expect(
			granularitiesForRange( CHART_PERIODS, params( '2025-01-01', '2026-06-30', 'month' ) )
		).toEqual( [ 'month' ] );
	} );

	it( 'names the clamped bucket when the range and the chart share nothing', () => {
		// Quarters and years only, none of which this chart draws — so it reports
		// what the chart clamps to rather than an empty set.
		expect(
			granularitiesForRange( CHART_PERIODS, params( '2020-01-01', '2026-06-30', 'year' ) )
		).toEqual( [ 'month' ] );
	} );

	it( 'never returns an empty set for a missing range', () => {
		expect(
			granularitiesForRange( CHART_PERIODS, params( '', '', 'day' ) ).length
		).toBeGreaterThan( 0 );
	} );
} );
