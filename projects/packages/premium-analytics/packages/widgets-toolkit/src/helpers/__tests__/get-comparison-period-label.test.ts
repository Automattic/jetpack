/**
 * Internal dependencies
 */
import { getComparisonPeriodLabel } from '../get-comparison-period-label';
import type { ReportParams } from '@jetpack-premium-analytics/data';

const WEEK = {
	from: '2026-10-05T00:00:00Z',
	to: '2026-10-11T23:59:59.999Z',
	interval: 'day',
} as const;

const SEP = '\u2009\u2013\u2009';

describe( 'getComparisonPeriodLabel', () => {
	it.each( [
		[ 'previous-period', '2026-09-28', '2026-10-04', 'Prev. 7 days' ],
		[ 'previous_period', '2026-09-28', '2026-10-04', 'Prev. 7 days' ],
		[ 'previous-week', '2026-09-28', '2026-10-04', 'Prev. 7 days' ],
		[ 'previous-month', '2026-09-05', '2026-09-11', 'Sep' ],
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

	it( 'measures the previous period the way the primary preset does', () => {
		const params = {
			from: '2026-09-01T00:00:00Z',
			to: '2026-09-30T23:59:59.999Z',
			interval: 'day',
			preset: 'last-30-days',
			comp: '1',
			compare_from: '2026-08-02T00:00:00Z',
			compare_to: '2026-08-31T23:59:59.999Z',
			compare_preset: 'previous-period',
		} as ReportParams;

		expect( getComparisonPeriodLabel( params ) ).toBe( 'Prev. 30 days' );
	} );

	it.each( [
		[
			'without a preset',
			undefined,
			'2026-09-28',
			'2026-10-04',
			`September 28${ SEP }October 4, 2026`,
		],
		[
			'for a preset the range does not offer',
			'custom',
			'2026-09-28',
			'2026-10-04',
			`September 28${ SEP }October 4, 2026`,
		],
		[
			'when the preset no longer resolves to the queried window',
			'previous-month',
			'2026-08-05',
			'2026-08-11',
			`August 5${ SEP }11, 2026`,
		],
	] )( 'falls back to the comparison range %s', ( _case, preset, from, to, expected ) => {
		const params = {
			...WEEK,
			comp: '1',
			compare_from: from,
			compare_to: to,
			compare_preset: preset,
		} as ReportParams;

		expect( getComparisonPeriodLabel( params ) ).toBe( expected );
	} );

	it( 'names nothing without a comparison', () => {
		expect( getComparisonPeriodLabel( WEEK as ReportParams ) ).toBeUndefined();
	} );
} );
