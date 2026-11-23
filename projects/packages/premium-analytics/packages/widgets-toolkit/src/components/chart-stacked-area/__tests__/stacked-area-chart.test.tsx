/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { StackedAreaChart } from '../stacked-area-chart';
import type { ComparativeLineChartSeries } from '../../chart-comparative-line/types';

type RecordedAreaChart = {
	stacked?: boolean;
	options?: { yScale?: { domain?: [ number, number ] } };
};

const mockAreaCharts: RecordedAreaChart[] = [];

// jsdom draws the chart at zero width, so the stack is read from what the real chart is handed.
jest.mock( '@jetpack-premium-analytics/externals', () => {
	const actual = jest.requireActual( '@jetpack-premium-analytics/externals' );
	const { createElement } = jest.requireActual( 'react' );
	const AreaChart = ( props: Record< string, unknown > ) => {
		mockAreaCharts.push( props as RecordedAreaChart );
		return createElement( actual.AreaChart, props );
	};
	return { ...actual, AreaChart };
} );

const JULY_1 = new Date( '2026-07-01T00:00:00Z' );
const JULY_2 = new Date( '2026-07-02T00:00:00Z' );

const part = ( label: string, values: [ number, number ] ): ComparativeLineChartSeries => ( {
	label,
	data: [
		{ date: JULY_1, value: values[ 0 ] },
		{ date: JULY_2, value: values[ 1 ] },
	],
} );

const renderChart = ( series: ComparativeLineChartSeries[] ) =>
	render(
		<GlobalChartsProvider>
			<StackedAreaChart series={ series } dataFormat={ { type: 'number' } } tickResolution="day" />
		</GlobalChartsProvider>
	);

describe( 'StackedAreaChart', () => {
	beforeEach( () => {
		mockAreaCharts.length = 0;
	} );

	it( 'fits the y-axis to the largest total of the stack, not to its largest part', () => {
		renderChart( [ part( 'Human', [ 9000, 4000 ] ), part( 'AI bots', [ 1000, 7000 ] ) ] );

		const chart = mockAreaCharts[ mockAreaCharts.length - 1 ];
		expect( chart.stacked ).toBe( true );
		expect( chart.options?.yScale?.domain ).toEqual( [ 0, 11000 ] );
	} );

	it( 'leaves the y-axis to the chart when every part is zero', () => {
		renderChart( [ part( 'Human', [ 0, 0 ] ), part( 'AI bots', [ 0, 0 ] ) ] );

		expect( mockAreaCharts[ mockAreaCharts.length - 1 ].options?.yScale ).toBeUndefined();
	} );
} );
