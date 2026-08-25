/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import { setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { siteSettingsIn } from '../../../__fixtures__/wp-date-settings';
import { ComparativeLineChart } from '../comparative-line-chart';
import type { ComparativeLineChartSeries } from '../types';

// Record the props handed to the underlying chart. The real one renders SVG
// through a provider jsdom cannot lay out, and what matters here is the tooltip
// renderer and the visibility settings this wrapper composes.
const mockLineSpy = jest.fn();
const mockLegendSpy = jest.fn();

jest.mock( '@jetpack-premium-analytics/externals', () => {
	const { forwardRef } = jest.requireActual( 'react' );

	const LineChart = ( props: { children?: React.ReactNode } ) => {
		mockLineSpy( props );
		return <div data-testid="line-chart">{ props.children }</div>;
	};
	LineChart.Legend = ( props: Record< string, unknown > ) => {
		mockLegendSpy( props );
		return <div data-testid="line-chart-legend" />;
	};

	return {
		LineChart,
		LineShape: () => null,
		RectShape: () => null,
		// The wrapper measures this element, so the stand-in must take the ref.
		Stack: forwardRef(
			(
				{ children }: { children?: React.ReactNode },
				ref: React.ForwardedRef< HTMLDivElement >
			) => <div ref={ ref }>{ children }</div>
		),
	};
} );

jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useResizeObserver: () => () => undefined,
} ) );

jest.mock( '../../../hooks', () => ( {
	useSeriesStyles: () => [],
} ) );

const DATA_FORMAT = { type: 'number' as const, options: { decimals: 0 } };

// A tooltip label reads its point as the instant it is, in the site's timezone,
// so these are instants and every assertion below fixes the site's zone. Callers
// whose points are wall clocks instead pass their own `formatTooltipDate`.
const JULY_1 = new Date( '2026-07-01T00:00:00Z' );
// 2pm on July 2 in Tokyo.
const JULY_2 = new Date( '2026-07-02T05:00:00Z' );
// 9am on June 1 in Tokyo.
const JUNE_1 = new Date( '2026-06-01T00:00:00Z' );

const SERIES: ComparativeLineChartSeries[] = [
	{
		label: 'July',
		group: 'views',
		data: [
			{ date: JULY_1, value: 100 },
			{ date: JULY_2, value: 200 },
		],
	},
];

const SERIES_WITH_COMPARISON: ComparativeLineChartSeries[] = [
	{
		label: 'Views',
		group: 'views',
		data: [ { date: JULY_1, value: 100 } ],
	},
	{
		label: 'Views · previous period',
		group: 'views',
		options: { type: 'comparison' },
		data: [ { date: JUNE_1, value: 80 } ],
	},
];

const PAIRED_SERIES: ComparativeLineChartSeries[] = [
	...SERIES_WITH_COMPARISON,
	{
		label: 'Visitors',
		group: 'visitors',
		data: [ { date: JULY_1, value: 40 } ],
	},
	{
		label: 'Visitors · previous period',
		group: 'visitors',
		options: { type: 'comparison' },
		data: [ { date: JUNE_1, value: 30 } ],
	},
];

// A comparison point carries the primary axis date, with the real
// previous-period date in `realDate`; that is what `alignSeriesDates` does.
const COMPARISON_POINT = {
	date: JULY_1,
	realDate: JUNE_1,
	value: 80,
};

type GetTooltipLabel = (
	datum: { date: Date; realDate?: Date },
	index: number,
	key: string
) => string;

type RecordedLineProps = {
	chartId?: string;
	defaultHiddenSeries?: readonly string[];
	legend: { collapseGroups: boolean; interactive: boolean };
	renderTooltip: ( params: unknown ) => { props: { getLabel: GetTooltipLabel } };
};

/**
 * The props the underlying chart last rendered with.
 *
 * @return The recorded props.
 */
function recordedProps(): RecordedLineProps {
	expect( mockLineSpy ).toHaveBeenCalled();
	return mockLineSpy.mock.calls.at( -1 )[ 0 ];
}

/**
 * The label the tooltip puts on a point, at a given series index. Index 0 is the
 * current period; anything higher is a comparison series.
 *
 * @param datum          - The hovered point.
 * @param datum.date     - The axis date it is plotted on.
 * @param datum.realDate - Its own date, when it belongs to a comparison series.
 * @param index          - Its series index.
 * @param key            - The series it belongs to.
 * @return The rendered row label.
 */
function tooltipLabelFor(
	datum: { date: Date; realDate?: Date },
	index = 0,
	key = 'July'
): string {
	/* eslint-disable testing-library/render-result-naming-convention --
	   This is the chart's `renderTooltip` prop and its return value, not
	   testing-library's `render()`; the rule matches on the name alone. */
	const tooltipNode = recordedProps().renderTooltip( {
		tooltipData: { datumByKey: { [ key ]: { datum, index, key } } },
	} );

	return tooltipNode.props.getLabel( datum, index, key );
	/* eslint-enable testing-library/render-result-naming-convention */
}

describe( 'ComparativeLineChart', () => {
	beforeEach( () => {
		mockLineSpy.mockClear();
		mockLegendSpy.mockClear();
	} );

	it( 'passes visibility settings through to the chart and legend', () => {
		render(
			<ComparativeLineChart
				chartId="traffic"
				series={ PAIRED_SERIES }
				dataFormat={ DATA_FORMAT }
				defaultHiddenSeries={ [ 'Visitors', 'Visitors · previous period' ] }
				legendInteractive
			/>
		);

		expect( recordedProps() ).toMatchObject( {
			chartId: 'traffic',
			defaultHiddenSeries: [ 'Visitors', 'Visitors · previous period' ],
			legend: { collapseGroups: true, interactive: true },
		} );
		expect( mockLegendSpy ).toHaveBeenLastCalledWith(
			expect.objectContaining( { interactive: true } )
		);
	} );

	it( 'collapses a single metric two periods into one legend item', () => {
		render( <ComparativeLineChart series={ SERIES_WITH_COMPARISON } dataFormat={ DATA_FORMAT } /> );

		// A legend item names the metric; solid vs previous-period mark is what
		// tells the two apart, so there is nothing for a second item to say.
		expect( recordedProps().legend ).toEqual( {
			collapseGroups: true,
			interactive: false,
		} );
	} );

	it( 'names a paired row after its metric, not after its own label', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render( <ComparativeLineChart series={ PAIRED_SERIES } dataFormat={ DATA_FORMAT } /> );

		expect( tooltipLabelFor( { date: JULY_1 }, 2, 'Visitors' ) ).toBe( 'Visitors · July 1, 2026' );
		// The comparison row borrows its group's current-period name rather than
		// leading with 'Visitors · previous period'.
		expect( tooltipLabelFor( COMPARISON_POINT, 3, 'Visitors · previous period' ) ).toBe(
			'Visitors · June 1, 2026'
		);
	} );

	it( 'falls back to the date for a key it has no series for', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render( <ComparativeLineChart series={ PAIRED_SERIES } dataFormat={ DATA_FORMAT } /> );

		// Leading with the raw key would present an internal label as a metric
		// name, which is the thing the prefix exists to stop.
		expect( tooltipLabelFor( COMPARISON_POINT, 0, 'Unknown' ) ).toBe( 'June 1, 2026' );
	} );

	// `buildReportMetricSeries` draws Views/Visitors/Comments/Likes together with
	// no comparison, so the performance chart reaches the paired branch too.
	it( 'names rows by series on a multi-metric chart with no comparison', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		const twoMetrics: ComparativeLineChartSeries[] = [
			{ label: 'Views', group: 'views', data: [ { date: JULY_1, value: 100 } ] },
			{ label: 'Visitors', group: 'visitors', data: [ { date: JULY_1, value: 40 } ] },
		];

		render( <ComparativeLineChart series={ twoMetrics } dataFormat={ DATA_FORMAT } /> );

		expect( tooltipLabelFor( { date: JULY_1 }, 1, 'Visitors' ) ).toBe( 'Visitors · July 1, 2026' );
	} );

	it( "labels a tooltip with the point's date, read in the site's timezone", () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render( <ComparativeLineChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

		expect( tooltipLabelFor( { date: JULY_2 } ) ).toBe( 'July 2, 2026' );
	} );

	// A date alone names 24 hourly buckets, so it cannot identify the one hovered
	// — and the hour it gains has to be the one the axis tick under it shows.
	it( 'adds the hour the point names at the hourly resolution', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render(
			<ComparativeLineChart series={ SERIES } dataFormat={ DATA_FORMAT } tickResolution="hour" />
		);

		expect( tooltipLabelFor( { date: JULY_2 } ) ).toBe( 'July 2, 2026 2:00 pm' );
	} );

	// How a point's date is read is the caller's to decide — Stats buckets are
	// wall clocks rather than instants — while which format names it stays here.
	it( 'hands the point and the format it picked to a caller-supplied formatter', () => {
		const formatTooltipDate = jest.fn( () => 'the bucket' );
		render(
			<ComparativeLineChart
				series={ SERIES }
				dataFormat={ DATA_FORMAT }
				tickResolution="hour"
				formatTooltipDate={ formatTooltipDate }
			/>
		);

		expect( tooltipLabelFor( { date: JULY_2 } ) ).toBe( 'the bucket' );
		expect( formatTooltipDate ).toHaveBeenCalledWith( JULY_2, 'dateTime' );
	} );

	it( 'labels a comparison row from its own date, not the axis date it shares', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render(
			<ComparativeLineChart series={ SERIES } dataFormat={ DATA_FORMAT } tickResolution="hour" />
		);

		// Reading `datum.date` here would repeat the current period's date on both
		// rows; the point of `realDate` is that the previous period keeps its own.
		expect( tooltipLabelFor( COMPARISON_POINT, 1 ) ).toBe( 'June 1, 2026 9:00 am' );
	} );
} );
