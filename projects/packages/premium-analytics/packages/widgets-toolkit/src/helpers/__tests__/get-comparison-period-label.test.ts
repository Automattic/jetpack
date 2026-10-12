/**
 * Internal dependencies
 */
import { formatLegendLabels } from '../format-legend-labels';
import { getComparisonPeriodLabel } from '../get-comparison-period-label';
import type { ReportParams } from '@jetpack-premium-analytics/data';

// Shaped like normalized params: each end is an instant, `to` the last moment of its day.
const WEEK = {
	from: '2026-10-05T00:00:00Z',
	to: '2026-10-11T23:59:59.999Z',
	interval: 'day',
} as const;

describe( 'getComparisonPeriodLabel', () => {
	it.each( [
		[ 'previous-period', '2026-09-28', '2026-10-04', 'Prev. 7 days' ],
		// A week back resolves to the same window, so the menu folds it into the previous period.
		[ 'previous-week', '2026-09-28', '2026-10-04', 'Prev. 7 days' ],
		[ 'previous-month', '2026-09-05', '2026-09-11', 'Sep' ],
		[ 'previous-year', '2025-10-05', '2025-10-11', '2025' ],
	] )( 'names the %s preset as the chart legend abbreviates it', ( preset, from, to, expected ) => {
		const params = {
			...WEEK,
			comp: '1',
			compare_from: from,
			compare_to: to,
			compare_preset: preset,
		} as ReportParams;

		expect( getComparisonPeriodLabel( params ) ).toBe( expected );
	} );

	it( 'falls back to the comparison range without a preset', () => {
		const params = {
			...WEEK,
			comp: '1',
			compare_from: '2026-09-28',
			compare_to: '2026-10-04',
		} as ReportParams;

		expect( getComparisonPeriodLabel( params ) ).toBe( formatLegendLabels( params ).comparison );
	} );

	it( 'names nothing without a comparison', () => {
		expect( getComparisonPeriodLabel( WEEK as ReportParams ) ).toBeUndefined();
	} );
} );
