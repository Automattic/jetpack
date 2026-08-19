/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { siteSettingsIn } from '../../../__fixtures__/wp-date-settings';
import { MetricTabsChart } from '../metric-tabs-chart';
import type { ComparativeLineChartSeries } from '../../chart-comparative-line/types';
import type { MetricTab } from '../metric-tabs-chart';
import type { DateFormatName } from '@jetpack-premium-analytics/formatters';

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

// Chart points are wall clocks, so this one is built from local parts, the same
// way `toChartDate` builds them.
const WALL_CLOCK_METRIC: MetricTab = {
	...METRIC,
	current: [
		{ date: new Date( 2026, 6, 1, 0, 0 ), value: 100 },
		{ date: new Date( 2026, 6, 2, 0, 0 ), value: 200 },
	],
	previous: undefined,
};

/**
 * The series the most recent chart render received.
 *
 * @param spy - The chart stand-in to read.
 * @return The recorded series.
 */
function recordedSeries( spy: jest.Mock ): ComparativeLineChartSeries[] {
	// Without this, a chart that never rendered yields `undefined` and the
	// assertions below fail as a TypeError that names the wrong cause.
	expect( spy ).toHaveBeenCalled();
	return spy.mock.calls.at( -1 )[ 0 ].series;
}

/**
 * The tooltip date formatter the most recent chart render received.
 *
 * @param spy - The chart stand-in to read.
 * @return The recorded formatter.
 */
function recordedTooltipDateFormatter(
	spy: jest.Mock
): ( date: Date, format: DateFormatName ) => string {
	expect( spy ).toHaveBeenCalled();
	return spy.mock.calls.at( -1 )[ 0 ].formatTooltipDate;
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

	it( 'renders a single metric as a static headline', () => {
		const describedMetric = { ...METRIC, description: 'Total views for the selected period.' };

		render( <MetricTabsChart metrics={ [ describedMetric ] } dataFormat={ DATA_FORMAT } /> );

		expect( screen.getByText( 'Views' ) ).toBeInTheDocument();
		expect( screen.getByText( describedMetric.description ) ).toBeInTheDocument();
		expect( screen.queryByTitle( describedMetric.description ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'tablist' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'tab' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'renders multiple metrics as tabs', () => {
		const visitors = { ...METRIC, key: 'visitors', label: 'Visitors' };

		render( <MetricTabsChart metrics={ [ METRIC, visitors ] } dataFormat={ DATA_FORMAT } /> );

		expect( screen.getByRole( 'tablist' ) ).toBeInTheDocument();
		expect( screen.getAllByRole( 'tab' ) ).toHaveLength( 2 );
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

	it( 'replaces an unavailable metric with its reason instead of drawing a zero line', () => {
		const reason = "Hourly data isn't available for this metric.";
		const unavailable = { ...METRIC, unavailable: reason };

		render( <MetricTabsChart metrics={ [ unavailable ] } dataFormat={ DATA_FORMAT } /> );

		expect( screen.queryByTestId( 'line-chart' ) ).not.toBeInTheDocument();
		expect( screen.getAllByText( reason ) ).not.toHaveLength( 0 );
		// The headline stands down to a placeholder rather than reporting a total
		// the endpoint never returned.
		expect( screen.queryByText( '300' ) ).not.toBeInTheDocument();
	} );

	// The legend names each series by its date range, read off the points — which
	// are wall clocks, so the range must not move with the site's timezone.
	it.each( [ 'Asia/Tokyo', 'America/Los_Angeles' ] )(
		'labels a series with the range its points name, on a site in %s',
		siteZone => {
			setSettings( siteSettingsIn( siteZone ) );

			render( <MetricTabsChart metrics={ [ WALL_CLOCK_METRIC ] } dataFormat={ DATA_FORMAT } /> );

			// `elideRange` borrows CLDR's range pattern, whose separator spaces are
			// typographic rather than plain ones.
			const label = recordedSeries( mockLineSpy )[ 0 ].label.replace( /\s/gu, ' ' );

			expect( label ).toBe( 'July 1 – 2, 2026' );
		}
	);

	// The charts read a point's date as an instant unless told otherwise, and
	// these points are wall clocks, so the reading is this component's to supply.
	it.each( [ 'Asia/Tokyo', 'America/Los_Angeles' ] )(
		'labels a chart point with the bucket it names, on a site in %s',
		siteZone => {
			setSettings( siteSettingsIn( siteZone ) );

			render( <MetricTabsChart metrics={ [ WALL_CLOCK_METRIC ] } dataFormat={ DATA_FORMAT } /> );

			const formatTooltipDate = recordedTooltipDateFormatter( mockLineSpy );

			expect( formatTooltipDate( new Date( 2026, 6, 2, 14, 0 ), 'dateTime' ) ).toBe(
				'July 2, 2026 2:00 pm'
			);
		}
	);

	it( 'keeps an unavailable metric selectable, so its reason stays reachable', () => {
		const unavailable = {
			...METRIC,
			key: 'likes',
			label: 'Likes',
			unavailable: "Hourly data isn't available for this metric.",
		};

		render( <MetricTabsChart metrics={ [ METRIC, unavailable ] } dataFormat={ DATA_FORMAT } /> );

		const tabs = screen.getAllByRole( 'tab' );
		expect( tabs ).toHaveLength( 2 );
		for ( const tab of tabs ) {
			expect( tab ).toBeEnabled();
		}
	} );

	it( 'emits a single series when the metric has no previous period', () => {
		const withoutPrevious = { ...METRIC, previous: undefined };

		render(
			<MetricTabsChart metrics={ [ withoutPrevious ] } dataFormat={ DATA_FORMAT } chartType="bar" />
		);

		expect( recordedSeries( mockBarSpy ) ).toHaveLength( 1 );
	} );
} );
