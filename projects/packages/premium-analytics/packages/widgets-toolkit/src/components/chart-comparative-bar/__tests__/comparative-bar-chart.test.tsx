/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import {
	mockBarChartLegendSpy,
	mockBarChartSpy,
	resetMockCharts,
	setMockChartHeight,
} from '../../../../../../tests/js/chart-test-utils';
import { siteSettingsIn } from '../../../__fixtures__/wp-date-settings';
import { ComparativeBarChart } from '../comparative-bar-chart';
import type { DatedTooltipModel, DatedTooltipProps } from '../../chart-tooltip';
import type { ComparativeBarChartSeries } from '../types';

jest.mock( '@jetpack-premium-analytics/externals', () =>
	jest.requireActual( '../../../../../../tests/js/chart-test-utils' ).mockChartExternals()
);

jest.mock(
	'@wordpress/compose',
	() => jest.requireActual( '../../../../../../tests/js/chart-test-utils' ).mockWordPressCompose
);

const DATA_FORMAT = { type: 'number' as const, options: { decimals: 0 } };

const JULY_1 = new Date( '2026-07-01T00:00:00Z' );
const JULY_2 = new Date( '2026-07-02T00:00:00Z' );

// A tooltip label reads its point as the instant it is, in the site's timezone, so
// every label assertion below fixes the site's zone.
const JULY_2_2PM_TOKYO = new Date( '2026-07-02T05:00:00Z' );

const SERIES: ComparativeBarChartSeries[] = [
	{
		label: 'July',
		group: 'views',
		data: [
			{ date: JULY_1, value: 100 },
			{ date: JULY_2, value: 200 },
		],
	},
];

// Comparison points already carry the primary axis dates (that is what
// `alignSeriesDates` does), with the real previous-period date in `realDate`.
// An hour apart, so the library reads the series as hourly on its own.
const HOURLY_SERIES: ComparativeBarChartSeries[] = [
	{
		label: 'July',
		group: 'views',
		data: [
			{ date: new Date( '2026-07-02T04:00:00Z' ), value: 100 },
			{ date: JULY_2_2PM_TOKYO, value: 200 },
		],
	},
];

const SERIES_WITH_COMPARISON: ComparativeBarChartSeries[] = [
	SERIES[ 0 ],
	{
		label: 'June',
		group: 'views',
		options: { type: 'comparison' },
		data: [
			{ date: JULY_1, realDate: new Date( '2026-06-01T00:00:00Z' ), value: 80 },
			{ date: JULY_2, realDate: new Date( '2026-06-02T00:00:00Z' ), value: 120 },
		],
	},
];

const UNGROUPED_SERIES_WITH_COMPARISON = SERIES_WITH_COMPARISON.map(
	( { label, data, options } ) => ( { label, data, options } )
);

// Two metrics on one chart, each with its previous period — what the traffic
// chart draws once the reader reveals the counterpart metric.
const PAIRED_SERIES: ComparativeBarChartSeries[] = [
	...SERIES_WITH_COMPARISON,
	{
		label: 'Visitors',
		group: 'visitors',
		data: [
			{ date: JULY_1, value: 40 },
			{ date: JULY_2, value: 60 },
		],
	},
	{
		label: 'Visitors · June',
		group: 'visitors',
		options: { type: 'comparison' },
		data: [
			{ date: JULY_1, realDate: new Date( '2026-06-01T00:00:00Z' ), value: 30 },
			{ date: JULY_2, realDate: new Date( '2026-06-02T00:00:00Z' ), value: 35 },
		],
	},
];

/** Every prop the most recent chart render received. */
function recordedProps(): {
	options: {
		axis: { x: Record< string, unknown >; y: Record< string, unknown > };
		yScale?: { domain: [ number, number ] };
	};
	margin: { left?: number; right: number };
	chartId: string;
	defaultHiddenSeries?: readonly string[];
	legend: { collapseGroups: boolean; interactive: boolean };
	gridVisibility?: string;
	showZeroValues?: boolean;
	withTooltips: boolean;
	renderTooltip: ( params: unknown ) => { props: DatedTooltipProps } | null;
} {
	// Fail on the real reason rather than a TypeError further down.
	expect( mockBarChartSpy ).toHaveBeenCalled();
	return mockBarChartSpy.mock.calls.at( -1 )[ 0 ];
}

/** The options the most recent chart render received. */
function recordedOptions() {
	return recordedProps().options;
}

type Entry = {
	datum: { date: Date; realDate?: Date; endDate?: Date; value?: number | null };
	key: string;
};

/**
 * The model the chart's tooltip renders for the hovered entries; the first is
 * the hovered one. The chart hands a custom renderer the drawn bars only, so a
 * comparison is not passed here: re-pairing it is the chart's job.
 *
 * @param entries - The bars the chart reports at the hovered date.
 * @return The dated tooltip's model.
 */
function tooltipModelFor( ...entries: Entry[] ): DatedTooltipModel {
	/* eslint-disable testing-library/render-result-naming-convention --
	   This is the chart's `renderTooltip` prop and its return value, not
	   testing-library's `render()`; the rule matches on the name alone. */
	const tooltipNode = recordedProps().renderTooltip( {
		tooltipData: {
			nearestDatum: { datum: entries[ 0 ].datum, key: entries[ 0 ].key },
			datumByKey: Object.fromEntries(
				entries.map( ( entry, index ) => [ entry.key, { ...entry, index } ] )
			),
		},
	} );
	/* eslint-enable testing-library/render-result-naming-convention */

	expect( tooltipNode?.props.indicatorType ).toBe( 'rect' );
	return tooltipNode!.props.model;
}

/** A row's reading as `name`, `value`, and the comparison value when it has one. */
function readings( model: DatedTooltipModel ) {
	return model.rows.map( row => [ row.name, row.value, row.previous?.value ] );
}

const hoveredJuly = ( date: Date ): Entry => ( { datum: { date, value: 100 }, key: 'July' } );

const ZERO_SERIES: ComparativeBarChartSeries[] = [
	{
		label: 'July',
		group: 'views',
		data: [
			{ date: JULY_1, value: 0 },
			{ date: JULY_2, value: 0 },
		],
	},
];

describe( 'ComparativeBarChart', () => {
	const originalSettings = getSettings();

	beforeEach( () => {
		resetMockCharts();
	} );

	afterEach( () => {
		setSettings( originalSettings );
	} );

	it( 'passes no x tickFormat when no tick format is requested', () => {
		render( <ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

		// `undefined` hands the axis to the chart's derived date formatter;
		// `formatDate`'s `medium` default would override it.
		expect( recordedOptions().axis.x.tickFormat ).toBeUndefined();
	} );

	it( 'formats the x ticks in the requested format', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render(
			<ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } tickFormat="short" />
		);

		const tickFormat = recordedOptions().axis.x.tickFormat as ( date: number ) => string;
		expect( tickFormat( JULY_1.getTime() ) ).toBe( 'July 1' );
	} );

	it( 'declares the bucket size to the x-axis', () => {
		render(
			<ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } tickResolution="hour" />
		);

		// Two hourly points an hour apart are also two daily points 24 hours apart
		// as far as gap-measuring goes, so the axis needs telling which it is.
		expect( recordedOptions().axis.x.tickResolution ).toBe( 'hour' );
	} );

	it( "heads the tooltip with the point's date, read in the site's timezone", () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render( <ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

		expect( tooltipModelFor( hoveredJuly( JULY_2_2PM_TOKYO ) ).date ).toBe( 'July 2, 2026' );
	} );

	// A date alone names 24 hourly buckets, so it cannot identify the one hovered
	// — and the hour it gains has to be the one the axis tick under it shows.
	it( 'adds the hour the point names at the hourly resolution', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render(
			<ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } tickResolution="hour" />
		);

		expect( tooltipModelFor( hoveredJuly( JULY_2_2PM_TOKYO ) ).date ).toBe(
			'July 2, 2026 2:00 pm'
		);
	} );

	// Most widgets declare no resolution, so reading the caller's prop alone left
	// an hourly series naming all 24 of a day's points with the same date.
	it( 'adds the hour for an hourly series that declares no resolution', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render( <ComparativeBarChart series={ HOURLY_SERIES } dataFormat={ DATA_FORMAT } /> );

		expect( tooltipModelFor( hoveredJuly( JULY_2_2PM_TOKYO ) ).date ).toBe(
			'July 2, 2026 2:00 pm'
		);
	} );

	it( 'pairs the previous-period value with its bar when comparing, under its own date', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render( <ComparativeBarChart series={ SERIES_WITH_COMPARISON } dataFormat={ DATA_FORMAT } /> );

		// The chart hands a custom tooltip renderer only the primary series, so without
		// re-pairing here the shadow bar's value would be unreadable.
		const model = tooltipModelFor( hoveredJuly( JULY_1 ) );
		expect( readings( model ) ).toEqual( [ [ 'July', 100, 80 ] ] );
		expect( model.previousDate ).toBe( 'June 1, 2026' );
		expect( readings( tooltipModelFor( hoveredJuly( JULY_2 ) ) ) ).toEqual( [
			[ 'July', 100, 120 ],
		] );
	} );

	it( 'heads the comparison column with the week its bar spans', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		const weekly: ComparativeBarChartSeries[] = [
			SERIES[ 0 ],
			{
				...SERIES_WITH_COMPARISON[ 1 ],
				data: [
					{
						date: JULY_1,
						realDate: new Date( '2026-06-01T00:00:00Z' ),
						endDate: new Date( '2026-06-07T12:00:00Z' ),
						value: 80,
					},
				],
			},
		];
		render( <ComparativeBarChart series={ weekly } dataFormat={ DATA_FORMAT } /> );

		expect( tooltipModelFor( hoveredJuly( JULY_1 ) ).previousDate ).toBe(
			'June 1\u2009\u2013\u20097, 2026'
		);
	} );

	it( 'pairs an ungrouped previous-period value with the first series', () => {
		render(
			<ComparativeBarChart series={ UNGROUPED_SERIES_WITH_COMPARISON } dataFormat={ DATA_FORMAT } />
		);

		expect( readings( tooltipModelFor( hoveredJuly( JULY_1 ) ) ) ).toEqual( [
			[ 'July', 100, 80 ],
		] );
	} );

	it( 'has no comparison column when there is no comparison series', () => {
		render( <ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

		const model = tooltipModelFor( hoveredJuly( JULY_1 ) );
		expect( readings( model ) ).toEqual( [ [ 'July', 100, undefined ] ] );
		expect( model.previousDate ).toBeUndefined();
	} );

	it( 'lists each drawn metric with its own comparison once two are drawn', () => {
		render( <ComparativeBarChart series={ PAIRED_SERIES } dataFormat={ DATA_FORMAT } /> );

		const model = tooltipModelFor( hoveredJuly( JULY_1 ), {
			datum: { date: JULY_1, value: 40 },
			key: 'Visitors',
		} );

		expect( readings( model ) ).toEqual( [
			[ 'July', 100, 80 ],
			[ 'Visitors', 40, 30 ],
		] );
	} );

	it( 'gives each row the swatch of its own series, the comparison its own too', () => {
		render( <ComparativeBarChart series={ PAIRED_SERIES } dataFormat={ DATA_FORMAT } /> );

		const [ july, visitors ] = tooltipModelFor( hoveredJuly( JULY_1 ), {
			datum: { date: JULY_1, value: 40 },
			key: 'Visitors',
		} ).rows;

		// The chart lists both current periods before either previous period, while the
		// styles follow the series, so a positional lookup would hand rows the wrong style.
		expect( july.indicator ).toEqual( {
			kind: 'series',
			style: { stroke: '#3858E9', opacity: undefined },
		} );
		expect( july.previous?.indicator ).toEqual( {
			kind: 'series',
			style: { stroke: '#3858E9', opacity: 0.5 },
		} );
		expect( visitors.indicator ).toEqual( {
			kind: 'series',
			style: { stroke: '#3858E9', opacity: undefined },
		} );
		expect( visitors.previous?.indicator ).toEqual( {
			kind: 'series',
			style: { stroke: '#3858E9', opacity: 0.5 },
		} );
	} );

	it( 'leaves a hidden metric out of the tooltip', () => {
		render( <ComparativeBarChart series={ PAIRED_SERIES } dataFormat={ DATA_FORMAT } /> );

		// A hidden series draws no bar, so the chart never reports one; re-pairing must
		// not resurrect the shadow of a metric the reader hid.
		expect( readings( tooltipModelFor( hoveredJuly( JULY_1 ) ) ) ).toEqual( [
			[ 'July', 100, 80 ],
		] );
	} );

	it( 'passes visibility settings through to the chart and legend', () => {
		render(
			<ComparativeBarChart
				chartId="traffic"
				series={ PAIRED_SERIES }
				dataFormat={ DATA_FORMAT }
				defaultHiddenSeries={ [ 'Visitors', 'Visitors · June' ] }
				legendInteractive
			/>
		);

		expect( recordedProps() ).toMatchObject( {
			chartId: 'traffic',
			defaultHiddenSeries: [ 'Visitors', 'Visitors · June' ],
			legend: { collapseGroups: true, interactive: true },
		} );
		expect( mockBarChartLegendSpy ).toHaveBeenLastCalledWith(
			expect.objectContaining( {
				interactive: true,
				shape: 'rect',
				shapeStyles: { margin: 0 },
				items: [
					{ label: 'July', color: '#3858E9', interactive: false },
					{ label: 'Visitors', color: '#3858E9' },
				],
			} )
		);
	} );

	it( 'collapses a single metric two periods into one legend item', () => {
		render( <ComparativeBarChart series={ SERIES_WITH_COMPARISON } dataFormat={ DATA_FORMAT } /> );

		// A legend item names the metric; solid vs previous-period mark is what
		// tells the two apart, so there is nothing for a second item to say.
		expect( recordedProps().legend ).toEqual( {
			collapseGroups: true,
			interactive: false,
		} );
	} );

	it( 'abbreviates the y axis ticks', () => {
		render( <ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

		const tickFormat = recordedOptions().axis.y.tickFormat as ( value: number ) => string;
		expect( tickFormat( 18432 ) ).toBe( '18.4K' );
	} );

	it( 'draws zero-value bars so a quiet day reads as zero, not missing data', () => {
		render( <ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

		expect( recordedProps().showZeroValues ).toBe( true );
	} );

	describe( 'pinned y-axis domains', () => {
		it( 'gives an all-zero period a readable axis instead of a flat baseline', () => {
			render( <ComparativeBarChart series={ ZERO_SERIES } dataFormat={ DATA_FORMAT } /> );

			expect( recordedOptions().yScale?.domain ).toEqual( [ 0, 80 ] );
			expect( recordedProps().withTooltips ).toBe( false );
		} );

		it( 'pins percentage metrics to 0-100% even when the data is bunched low', () => {
			render(
				<ComparativeBarChart
					series={ [ { label: 'July', group: 'rate', data: [ { date: JULY_1, value: 0.03 } ] } ] }
					dataFormat={ { type: 'percentage' } }
				/>
			);

			// Scaling to the data would make a 3% bar fill the plot.
			expect( recordedOptions().yScale?.domain ).toEqual( [ 0, 1 ] );
		} );

		it( 'leaves the pinned domain to size its own gutter', () => {
			render( <ComparativeBarChart series={ ZERO_SERIES } dataFormat={ DATA_FORMAT } /> );

			// `useChartMargin` measures the pinned domain's own ticks, so there is
			// nothing left for this component to override.
			expect( recordedOptions().yScale.domain ).toBeDefined();
			expect( recordedProps().margin ).toBeUndefined();
		} );

		it( 'lets the chart scale to the data otherwise', () => {
			render( <ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

			expect( recordedOptions() ).not.toHaveProperty( 'yScale' );
			// No override, so the chart keeps the gutters `useChartMargin` measured.
			expect( recordedProps().margin ).toBeUndefined();
		} );
	} );

	describe( 'compactWhenShort', () => {
		it( 'degrades to a sparkline on a short tile', () => {
			setMockChartHeight( 80 );
			render(
				<ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } compactWhenShort />
			);

			expect( recordedOptions().axis.y.display ).toBe( false );
			expect( recordedProps().gridVisibility ).toBe( 'none' );
			// The hidden axis frees its gutter inside `useChartMargin`, so the bars
			// gain the room without this component clipping the date labels away.
			expect( recordedProps().margin ).toBeUndefined();
			expect( screen.queryByTestId( 'bar-chart-legend' ) ).not.toBeInTheDocument();
		} );

		it( 'keeps the axis, grid, and legend when the tile is tall enough', () => {
			setMockChartHeight( 400 );
			render(
				<ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } compactWhenShort />
			);

			expect( recordedOptions().axis.y ).not.toHaveProperty( 'display' );
			expect( recordedProps().gridVisibility ).toBeUndefined();
			expect( screen.getByTestId( 'bar-chart-legend' ) ).toBeInTheDocument();
		} );

		it( 'ignores the breakpoint when not opted in', () => {
			setMockChartHeight( 80 );
			render( <ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

			expect( recordedOptions().axis.y ).not.toHaveProperty( 'display' );
			expect( recordedProps().gridVisibility ).toBeUndefined();
		} );
	} );
} );

describe( 'ComparativeBarChart tooltip extras', () => {
	const CPM_EXTRA = {
		label: 'Average CPM',
		data: [ { date: JULY_1, value: 0.15 } ],
		dataFormat: { type: 'currency' as const, options: { decimals: 2 } },
	};

	const originalSettings = getSettings();

	beforeEach( () => {
		resetMockCharts();
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
	} );

	afterEach( () => {
		setSettings( originalSettings );
	} );

	it( "adds each extra's value for the hovered bar, and nothing for a date it lacks", () => {
		render(
			<ComparativeBarChart
				series={ SERIES }
				dataFormat={ DATA_FORMAT }
				tooltipExtras={ [ CPM_EXTRA ] }
			/>
		);

		expect( readings( tooltipModelFor( hoveredJuly( JULY_1 ) ) ) ).toEqual( [
			[ 'July', 100, undefined ],
			[ 'Average CPM', 0.15, undefined ],
		] );
		expect( readings( tooltipModelFor( hoveredJuly( JULY_2 ) ) ) ).toEqual( [
			[ 'July', 100, undefined ],
		] );
	} );

	it( 'keeps the tooltip on for an all-zero drawn series once an extra has data', () => {
		render(
			<ComparativeBarChart
				series={ ZERO_SERIES }
				dataFormat={ DATA_FORMAT }
				tooltipExtras={ [ { ...CPM_EXTRA, data: [ { date: JULY_1, value: 0 } ] } ] }
			/>
		);
		expect( recordedProps().withTooltips ).toBe( false );

		render(
			<ComparativeBarChart
				series={ ZERO_SERIES }
				dataFormat={ DATA_FORMAT }
				tooltipExtras={ [ CPM_EXTRA ] }
			/>
		);
		expect( recordedProps().withTooltips ).toBe( true );
	} );
} );
