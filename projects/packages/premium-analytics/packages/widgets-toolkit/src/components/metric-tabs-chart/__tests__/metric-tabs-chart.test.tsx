/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { MetricTabsChart } from '../metric-tabs-chart';
import type { ComparativeLineChartSeries } from '../../chart-comparative-line/types';
import type { MetricTab } from '../metric-tabs-chart';

// The charts themselves render SVG through a provider that jsdom cannot lay
// out. Standing them in for prop recorders keeps this test on what this
// component decides: which chart renders, and how the comparison series is
// shaped for it.
const mockLineSpy = jest.fn();
const mockBarSpy = jest.fn();

jest.mock( '../../chart-comparative-line', () => ( {
	ComparativeLineChart: ( props: { series: ComparativeLineChartSeries[] } ) => {
		mockLineSpy( props );
		return <div data-testid="line-chart" />;
	},
} ) );

jest.mock( '../../chart-comparative-bar', () => ( {
	ComparativeBarChart: ( props: { series: ComparativeLineChartSeries[] } ) => {
		mockBarSpy( props );
		return <div data-testid="bar-chart" />;
	},
} ) );

jest.mock( '../../../hooks', () => ( {
	useSeriesStyles: () => [],
} ) );

const DATA_FORMAT = { type: 'number' as const, options: { decimals: 0 } };

const METRIC: MetricTab = {
	key: 'views',
	label: 'Views',
	value: 300,
	previousValue: 200,
	current: [
		{ date: new Date( '2026-07-01T00:00:00Z' ), value: 100 },
		{ date: new Date( '2026-07-02T00:00:00Z' ), value: 200 },
	],
	previous: [
		{ date: new Date( '2026-06-01T00:00:00Z' ), value: 80 },
		{ date: new Date( '2026-06-02T00:00:00Z' ), value: 120 },
	],
};

/**
 * The series the most recent chart render received.
 *
 * @param spy - The chart stand-in to read.
 * @return The recorded series.
 */
function recordedSeries( spy: jest.Mock ): ComparativeLineChartSeries[] {
	return spy.mock.calls.at( -1 )?.[ 0 ].series;
}

describe( 'MetricTabsChart', () => {
	beforeEach( () => {
		mockLineSpy.mockClear();
		mockBarSpy.mockClear();
	} );

	it( 'draws a line chart by default', () => {
		render( <MetricTabsChart metrics={ [ METRIC ] } dataFormat={ DATA_FORMAT } /> );

		expect( screen.getByTestId( 'line-chart' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'bar-chart' ) ).not.toBeInTheDocument();
	} );

	it( 'draws a bar chart when chartType is bar', () => {
		render( <MetricTabsChart metrics={ [ METRIC ] } dataFormat={ DATA_FORMAT } chartType="bar" /> );

		expect( screen.getByTestId( 'bar-chart' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'line-chart' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the previous period as a same-group comparison series in both chart types', () => {
		render( <MetricTabsChart metrics={ [ METRIC ] } dataFormat={ DATA_FORMAT } /> );
		render( <MetricTabsChart metrics={ [ METRIC ] } dataFormat={ DATA_FORMAT } chartType="bar" /> );

		for ( const series of [ recordedSeries( mockLineSpy ), recordedSeries( mockBarSpy ) ] ) {
			expect( series ).toHaveLength( 2 );
			expect( series[ 0 ].group ).toBe( 'views' );
			expect( series[ 1 ].group ).toBe( 'views' );
			expect( series[ 1 ].options?.type ).toBe( 'comparison' );
			expect( series[ 1 ].data ).toEqual( METRIC.previous );
		}
	} );

	it( 'omits the transparent gradient for bars, which would erase the shadow bar', () => {
		render( <MetricTabsChart metrics={ [ METRIC ] } dataFormat={ DATA_FORMAT } /> );
		render( <MetricTabsChart metrics={ [ METRIC ] } dataFormat={ DATA_FORMAT } chartType="bar" /> );

		// The line chart suppresses its own area fill so only the current period
		// is filled; a bar's fill *is* the shadow, so it must not be zeroed out.
		expect( recordedSeries( mockLineSpy )[ 1 ].options?.gradient ).toEqual( {
			from: 'transparent',
			to: 'transparent',
			fromOpacity: 0,
			toOpacity: 0,
		} );
		expect( recordedSeries( mockBarSpy )[ 1 ].options?.gradient ).toBeUndefined();
	} );

	it( 'emits a single series when the metric has no previous period', () => {
		const withoutPrevious = { ...METRIC, previous: undefined };

		render(
			<MetricTabsChart metrics={ [ withoutPrevious ] } dataFormat={ DATA_FORMAT } chartType="bar" />
		);

		expect( recordedSeries( mockBarSpy ) ).toHaveLength( 1 );
	} );
} );
