/**
 * Internal dependencies
 */
import { trafficIntervalExtension } from '../interval-extension';
import type { TrafficChartType } from '../widget';
import type { IntervalExtension, IntervalRange } from '@jetpack-premium-analytics/data';

const ADD_DAYS: IntervalExtension = { extra: [ 'day' ] };
const WITHHOLD_DAYS: IntervalExtension = {
	unavailable: { intervals: [ 'day' ], hint: 'Switch to the line chart to see each day.' },
};

describe( 'trafficIntervalExtension', () => {
	it.each< [ string, IntervalRange, TrafficChartType, IntervalExtension ] >( [
		[
			'adds days to Last 90 days as a line',
			{ preset: 'last-90-days', from: '2026-07-18', to: '2026-10-15' },
			'line',
			ADD_DAYS,
		],
		[
			'withholds days from Last 12 months as bars',
			{ preset: 'last-12-months', from: '2025-11-01', to: '2026-10-31' },
			'bar',
			WITHHOLD_DAYS,
		],
		[
			'adds days to a leap year',
			{ from: '2024-01-01T00:00:00', to: '2024-12-31T23:59:59' },
			'line',
			ADD_DAYS,
		],
		[
			'adds nothing past 366 days',
			{ from: '2024-01-01T00:00:00', to: '2025-01-01T23:59:59' },
			'line',
			{},
		],
		[
			'adds nothing to Last 24 hours',
			{ preset: 'last-24-hours', from: '2026-10-21T10:00:00', to: '2026-10-22T10:00:00' },
			'line',
			{},
		],
	] )( '%s', ( _, range, chartType, expected ) => {
		expect( trafficIntervalExtension( range, chartType ) ).toEqual( expected );
	} );
} );
