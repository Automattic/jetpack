/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useDetailChartIntervals } from './use-detail-chart-intervals';
import type { IntervalType } from '@jetpack-premium-analytics/data';

/**
 * Render the hook once and return the interval props it hands `DateFiltersPanel`.
 *
 * @param interval - The interval the date-filter controller resolved.
 * @param options  - The buckets the range allows, finest first.
 * @return The hook's result.
 */
function run( interval: IntervalType, options: IntervalType[] ) {
	return renderHook( () => useDetailChartIntervals( interval, options ) ).result.current;
}

describe( 'useDetailChartIntervals', () => {
	it( 'passes through the buckets the detail charts draw', () => {
		expect( run( 'week', [ 'day', 'week' ] ) ).toEqual( {
			withIntervalControl: true,
			interval: 'week',
			intervalOptions: [ 'day', 'week' ],
		} );
	} );

	it( 'names the daily bucket when the range only allows hourly ones', () => {
		// Today, Yesterday, and Last 24 hours: the charts sum daily history, so
		// the hour on offer redraws as a single daily bucket. The control stays,
		// naming the bucket that is drawn.
		expect( run( 'hour', [ 'hour' ] ) ).toEqual( {
			withIntervalControl: true,
			interval: 'day',
			intervalOptions: [ 'day' ],
		} );
	} );

	it( 'drops hour from a short custom range and checks the bucket drawn', () => {
		expect( run( 'hour', [ 'day', 'hour' ] ) ).toEqual( {
			withIntervalControl: true,
			interval: 'day',
			intervalOptions: [ 'day' ],
		} );
	} );

	it( 'drops quarter from a year-long range and checks the bucket drawn', () => {
		expect( run( 'quarter', [ 'month', 'quarter' ] ) ).toEqual( {
			withIntervalControl: true,
			interval: 'month',
			intervalOptions: [ 'month' ],
		} );
	} );

	it( 'names the monthly bucket on a multi-year range, which offers neither', () => {
		expect( run( 'year', [ 'quarter', 'year' ] ) ).toEqual( {
			withIntervalControl: true,
			interval: 'month',
			intervalOptions: [ 'month' ],
		} );
	} );
} );
