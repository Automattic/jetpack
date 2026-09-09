/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { siteSettingsIn } from '../../../__fixtures__/wp-date-settings';
import { MetricTabsChart } from '../metric-tabs-chart';
import type { ComparativeLineChartSeries } from '../../chart-comparative-line/types';
import type { MetricTab } from '../metric-tabs-chart';
import type { DateFormatName } from '@jetpack-premium-analytics/formatters';

// The charts render SVG through a provider jsdom cannot lay out, so stand them in
// for prop recorders.
const mockLineSpy = jest.fn();
const mockBarSpy = jest.fn();

jest.mock( '../../chart-comparative-line', () => ( {
	ComparativeLineChart: ( props: ChartProps ) => {
		mockLineSpy( props );
		return <div data-testid="line-chart" />;
	},
} ) );

jest.mock( '../../chart-comparative-bar', () => ( {
	ComparativeBarChart: ( props: ChartProps ) => {
		mockBarSpy( props );
		return <div data-testid="bar-chart" />;
	},
} ) );

jest.mock( '../../../hooks', () => ( {
	useSeriesStyles: () => [],
} ) );

type ChartProps = {
	series: ComparativeLineChartSeries[];
	chartId?: string;
	defaultHiddenSeries?: readonly string[];
	legendInteractive?: boolean;
	onPointerDown?: ( params: PointerParams ) => void;
	onPointerUp?: ( params: PointerParams ) => void;
	onDatumActivate?: ( params: { datum: unknown } ) => void;
};

type PointerParams = {
	datum?: unknown;
	svgPoint?: { x: number; y: number };
};

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

const VIEWS: MetricTab = { ...METRIC, counterpartKey: 'visitors' };

const VISITORS: MetricTab = {
	key: 'visitors',
	label: 'Visitors',
	value: 120,
	previousValue: 100,
	current: [
		{ date: new Date( '2026-07-01T00:00:00Z' ), value: 40 },
		{ date: new Date( '2026-07-02T00:00:00Z' ), value: 80 },
	],
	previous: [
		{ date: new Date( '2026-06-01T00:00:00Z' ), value: 30 },
		{ date: new Date( '2026-06-02T00:00:00Z' ), value: 70 },
	],
	counterpartKey: 'views',
};

/** The props the most recent chart render received. */
function recordedProps( spy: jest.Mock ): ChartProps {
	// Without this, a chart that never rendered yields `undefined` and the
	// assertions below fail as a TypeError that names the wrong cause.
	expect( spy ).toHaveBeenCalled();
	return spy.mock.calls.at( -1 )[ 0 ];
}

/** The series the most recent chart render received. */
function recordedSeries( spy: jest.Mock ): ComparativeLineChartSeries[] {
	return recordedProps( spy ).series;
}

/** Play a press and release over a datum, optionally moving between them. */
function pressAndRelease( spy: jest.Mock, datum: unknown, distance = 0 ) {
	const { onPointerDown, onPointerUp } = recordedProps( spy );

	onPointerDown?.( { datum, svgPoint: { x: 10, y: 10 } } );
	onPointerUp?.( { datum, svgPoint: { x: 10 + distance, y: 10 } } );
}

/**
 * The props of the render that drew `label` as its active metric. During a tab
 * switch, the outgoing panel may render again before the incoming panel mounts,
 * so the most recent call is not necessarily the metric under test.
 */
function recordedPropsFor( spy: jest.Mock, label: string ): ChartProps {
	const call = spy.mock.calls
		.filter( ( [ props ] ) => props.series[ 0 ]?.label === label )
		.at( -1 );
	expect( call ).toBeDefined();
	return call[ 0 ];
}

/** The tooltip date formatter the most recent chart render received. */
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

	// A point's date is the instant it is: the component passes it through, and
	// the site's zone decides which calendar day that instant lands on.
	it.each( [
		[ 'Asia/Tokyo', 'July 2, 2026 12:00 am' ],
		[ 'America/Los_Angeles', 'July 1, 2026 8:00 am' ],
	] )( 'labels a point in the site zone, on a site in %s', ( siteZone, expected ) => {
		setSettings( siteSettingsIn( siteZone ) );

		const instant = new Date( Date.UTC( 2026, 6, 1, 15, 0 ) );

		render(
			<MetricTabsChart
				metrics={ [
					{ ...METRIC, current: [ { date: instant, value: 100 } ], previous: undefined },
				] }
				dataFormat={ DATA_FORMAT }
			/>
		);

		expect( recordedTooltipDateFormatter( mockLineSpy )( instant, 'dateTime' ) ).toBe( expected );
	} );

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

	it( 'names every series after its metric, keeping the two comparisons apart', () => {
		render( <MetricTabsChart metrics={ [ VIEWS, VISITORS ] } dataFormat={ DATA_FORMAT } /> );

		const { series } = recordedPropsFor( mockLineSpy, 'Views' );

		// The current period carries the bare metric name, which is what the collapsed
		// legend item shows.
		expect( series[ 0 ].label ).toBe( 'Views' );
		expect( series[ 2 ].label ).toBe( 'Visitors' );
		expect( new Set( series.map( item => item.label ) ).size ).toBe( series.length );
		expect( series[ 1 ].label ).toBe( 'Views · previous period' );
		expect( series[ 3 ].label ).toBe( 'Visitors · previous period' );
	} );

	it( 'keeps seeded-hidden labels stable when the dashboard range changes', () => {
		const { rerender } = render(
			<MetricTabsChart metrics={ [ VIEWS, VISITORS ] } dataFormat={ DATA_FORMAT } />
		);
		const before = recordedPropsFor( mockLineSpy, 'Views' );
		const changedVisitors = {
			...VISITORS,
			previous: [
				{ date: new Date( '2026-05-01T00:00:00Z' ), value: 25 },
				{ date: new Date( '2026-05-02T00:00:00Z' ), value: 65 },
			],
		};

		rerender(
			<MetricTabsChart metrics={ [ VIEWS, changedVisitors ] } dataFormat={ DATA_FORMAT } />
		);
		const after = recordedPropsFor( mockLineSpy, 'Views' );

		expect( after.chartId ).toBe( before.chartId );
		expect( after.series[ 3 ].label ).toBe( before.series[ 3 ].label );
		expect( after.defaultHiddenSeries ).toEqual( [
			after.series[ 2 ].label,
			after.series[ 3 ].label,
		] );
	} );

	it( 'draws the counterpart alongside the active metric and seeds it hidden', () => {
		render( <MetricTabsChart metrics={ [ VIEWS, VISITORS ] } dataFormat={ DATA_FORMAT } /> );

		const { series, defaultHiddenSeries, legendInteractive } = recordedPropsFor(
			mockLineSpy,
			'Views'
		);

		expect( series ).toHaveLength( 4 );
		expect( series[ 2 ].group ).toBe( 'visitors' );
		expect( series[ 3 ].options?.type ).toBe( 'comparison' );
		// Both of the counterpart's series, so revealing its legend item brings
		// back the previous-period overlay with it.
		expect( defaultHiddenSeries ).toEqual( [ series[ 2 ].label, series[ 3 ].label ] );
		expect( legendInteractive ).toBe( true );
	} );

	it( 'swaps the pair around when the reader picks the counterpart', () => {
		render( <MetricTabsChart metrics={ [ VIEWS, VISITORS ] } dataFormat={ DATA_FORMAT } /> );

		const before = recordedPropsFor( mockLineSpy, 'Views' );
		// This package does not depend on @testing-library/user-event.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'tab', { name: /Visitors/ } ) );
		const after = recordedPropsFor( mockLineSpy, 'Visitors' );

		expect( after.series[ 0 ].group ).toBe( 'visitors' );
		expect( after.defaultHiddenSeries ).toEqual( [
			after.series[ 2 ].label,
			after.series[ 3 ].label,
		] );
		expect( after.series[ 2 ].label ).toBe( 'Views' );
		// Each metric gets its own visibility bucket in the charts provider.
		expect( after.chartId ).not.toBe( before.chartId );
	} );

	it( 'leaves the legend inert for a metric with no counterpart', () => {
		render( <MetricTabsChart metrics={ [ METRIC ] } dataFormat={ DATA_FORMAT } /> );

		const { series, defaultHiddenSeries, legendInteractive } = recordedProps( mockLineSpy );

		expect( series ).toHaveLength( 2 );
		expect( defaultHiddenSeries ).toBeUndefined();
		expect( legendInteractive ).toBe( false );
	} );

	it( 'ignores a counterpart key that names no metric', () => {
		const orphan = { ...METRIC, counterpartKey: 'nowhere' };

		render( <MetricTabsChart metrics={ [ orphan ] } dataFormat={ DATA_FORMAT } /> );

		expect( recordedProps( mockLineSpy ).series ).toHaveLength( 2 );
		expect( recordedProps( mockLineSpy ).legendInteractive ).toBe( false );
	} );

	// The Traffic summary pairs Views with Visitors, but the hourly grain serves Views
	// alone, so drawing the pair there offers the legend a flat zero line.
	it( 'ignores a counterpart with nothing to report at this bucket size', () => {
		const unavailableVisitors = { ...VISITORS, unavailable: "Hourly data isn't available." };

		render(
			<MetricTabsChart metrics={ [ VIEWS, unavailableVisitors ] } dataFormat={ DATA_FORMAT } />
		);

		const { series, defaultHiddenSeries, legendInteractive } = recordedPropsFor(
			mockLineSpy,
			'Views'
		);

		expect( series ).toHaveLength( 2 );
		expect( defaultHiddenSeries ).toBeUndefined();
		expect( legendInteractive ).toBe( false );
	} );

	it( 'ignores a counterpart key that names the metric itself', () => {
		const selfPaired = { ...METRIC, counterpartKey: METRIC.key };

		render( <MetricTabsChart metrics={ [ selfPaired ] } dataFormat={ DATA_FORMAT } /> );

		expect( recordedProps( mockLineSpy ).series ).toHaveLength( 2 );
		expect( recordedProps( mockLineSpy ).defaultHiddenSeries ).toBeUndefined();
		expect( recordedProps( mockLineSpy ).legendInteractive ).toBe( false );
	} );

	it( 'pairs the metrics in bar mode too', () => {
		render(
			<MetricTabsChart metrics={ [ VIEWS, VISITORS ] } dataFormat={ DATA_FORMAT } chartType="bar" />
		);

		const { series, defaultHiddenSeries } = recordedPropsFor( mockBarSpy, 'Views' );

		expect( series ).toHaveLength( 4 );
		expect( defaultHiddenSeries ).toEqual( [ series[ 2 ].label, series[ 3 ].label ] );
	} );

	it( 'keeps the same chart ID across a chart-type switch', () => {
		// Switching chart type remounts a different component, and the provider only
		// carries a revealed counterpart over that remount under the same chart ID.
		const { rerender } = render(
			<MetricTabsChart metrics={ [ VIEWS, VISITORS ] } dataFormat={ DATA_FORMAT } />
		);

		const lineChartId = recordedPropsFor( mockLineSpy, 'Views' ).chartId;
		// Guard the assertion below against passing on undefined === undefined.
		expect( lineChartId ).toEqual( expect.any( String ) );

		rerender(
			<MetricTabsChart metrics={ [ VIEWS, VISITORS ] } dataFormat={ DATA_FORMAT } chartType="bar" />
		);

		expect( recordedPropsFor( mockBarSpy, 'Views' ).chartId ).toBe( lineChartId );
	} );

	describe( 'onDatumClick', () => {
		const CLICKED = new Date( '2026-07-02T00:00:00Z' );

		it.each( [
			[ 'line', mockLineSpy, undefined ],
			[ 'bar', mockBarSpy, 'bar' ],
		] as const )( 'reports a click on the %s chart', ( _name, spy, chartType ) => {
			const onDatumClick = jest.fn();

			render(
				<MetricTabsChart
					metrics={ [ METRIC ] }
					dataFormat={ DATA_FORMAT }
					chartType={ chartType }
					onDatumClick={ onDatumClick }
				/>
			);

			pressAndRelease( spy, { date: CLICKED, value: 200 } );

			expect( onDatumClick ).toHaveBeenCalledWith( CLICKED );
		} );

		// Literal on purpose. Importing the component's tolerance would move both
		// sides with it, leaving the threshold unpinned.
		it.each( [
			[ 6, true ],
			[ 7, false ],
		] )( 'travelling %ipx reports a click: %s', ( distance, reports ) => {
			const onDatumClick = jest.fn();

			render(
				<MetricTabsChart
					metrics={ [ METRIC ] }
					dataFormat={ DATA_FORMAT }
					onDatumClick={ onDatumClick }
				/>
			);

			pressAndRelease( mockLineSpy, { date: CLICKED, value: 200 }, distance );

			expect( onDatumClick ).toHaveBeenCalledTimes( reports ? 1 : 0 );
		} );

		/*
		 * A release the chart never saw a press for started off the plot, so it
		 * must not open a date the pointer only happened to end over.
		 */
		it( 'ignores a release with no press behind it', () => {
			const onDatumClick = jest.fn();

			render(
				<MetricTabsChart
					metrics={ [ METRIC ] }
					dataFormat={ DATA_FORMAT }
					onDatumClick={ onDatumClick }
				/>
			);

			recordedProps( mockLineSpy ).onPointerUp?.( {
				datum: { date: CLICKED, value: 200 },
				svgPoint: { x: 10, y: 10 },
			} );

			expect( onDatumClick ).not.toHaveBeenCalled();
		} );

		it( 'ignores a release over nothing datable', () => {
			const onDatumClick = jest.fn();

			render(
				<MetricTabsChart
					metrics={ [ METRIC ] }
					dataFormat={ DATA_FORMAT }
					onDatumClick={ onDatumClick }
				/>
			);

			pressAndRelease( mockLineSpy, { value: 200 } );

			expect( onDatumClick ).not.toHaveBeenCalled();
		} );

		// The keyboard counterpart of the click: Enter on the point navigation
		// selected reports the same date a pointer release over it would.
		it.each( [
			[ 'line', mockLineSpy, undefined ],
			[ 'bar', mockBarSpy, 'bar' ],
		] as const )( 'reports a keyboard activation on the %s chart', ( _name, spy, chartType ) => {
			const onDatumClick = jest.fn();

			render(
				<MetricTabsChart
					metrics={ [ METRIC ] }
					dataFormat={ DATA_FORMAT }
					chartType={ chartType }
					onDatumClick={ onDatumClick }
				/>
			);

			recordedProps( spy ).onDatumActivate?.( { datum: { date: CLICKED, value: 200 } } );

			expect( onDatumClick ).toHaveBeenCalledWith( CLICKED );
		} );

		it( 'leaves the chart without pointer or keyboard handlers when nothing listens', () => {
			render( <MetricTabsChart metrics={ [ METRIC ] } dataFormat={ DATA_FORMAT } /> );

			expect( recordedProps( mockLineSpy ).onPointerUp ).toBeUndefined();
			expect( recordedProps( mockLineSpy ).onPointerDown ).toBeUndefined();
			expect( recordedProps( mockLineSpy ).onDatumActivate ).toBeUndefined();
		} );
	} );
} );
