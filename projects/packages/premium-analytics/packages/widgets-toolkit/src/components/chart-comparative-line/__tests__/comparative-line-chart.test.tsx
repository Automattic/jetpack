/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import { setSettings } from '@wordpress/date';
import { _n } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { siteSettingsIn } from '../../../__fixtures__/wp-date-settings';
import { ComparativeLineChart } from '../comparative-line-chart';
import type { DatedTooltipModel, DatedTooltipProps } from '../../chart-tooltip';
import type { ComparativeLineChartSeries } from '../types';

// The real chart renders SVG through a provider jsdom cannot lay out, so record
// the props instead: the tooltip renderer and visibility settings are the subject.
const mockLineSpy = jest.fn();
const mockLegendSpy = jest.fn();
// What the provider reports hidden for the chart under test.
let mockHiddenSeries = new Set< string >();

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
		// The real classifier: this is what the tooltip format now follows.
		getBucketInfo: jest.requireActual( '@automattic/charts' ).getBucketInfo,
		// One item per non-comparison series, as `collapseGroups` would produce.
		useChartLegendItems: ( data: { label: string; options?: { type?: string } }[] ) =>
			data
				.filter( series => series.options?.type !== 'comparison' )
				.map( series => ( { label: series.label, color: '#3858E9' } ) ),
		LineShape: () => null,
		RectShape: () => null,
		scaleLinear: jest.requireActual( '@visx/scale' ).scaleLinear,
		useGlobalChartsContext: () => ( { getHiddenSeries: () => new Set( mockHiddenSeries ) } ),
		// The wrapper measures this element, so the stand-in must take the ref.
		Stack: forwardRef(
			(
				{ children }: { children?: React.ReactNode },
				ref: React.ForwardedRef< HTMLDivElement >
			) => <div ref={ ref }>{ children }</div>
		),
	};
} );

// jsdom's ResizeObserver is a no-op stub, so the real hook's callback never fires
// and the chart measures as infinitely tall, leaving `compactWhenShort` unreachable.
let mockChartHeight = Infinity;

jest.mock( '@wordpress/compose', () => ( {
	...jest.requireActual( '@wordpress/compose' ),
	useResizeObserver:
		( onResize: ( entries: { contentRect: { height: number } }[] ) => void ) =>
		( element: HTMLElement | null ) => {
			if ( element ) {
				onResize( [ { contentRect: { height: mockChartHeight } } ] );
			}
		},
} ) );

jest.mock( '../../../hooks', () => ( {
	useSeriesStyles: () => [],
} ) );

const DATA_FORMAT = { type: 'number' as const, options: { decimals: 0 } };

// A tooltip label reads its point as the instant it is, in the site's timezone, so
// these are instants and every assertion below fixes the site's zone.
const JULY_1 = new Date( '2026-07-01T00:00:00Z' );
// 2pm on July 2 in Tokyo.
const JULY_2 = new Date( '2026-07-02T05:00:00Z' );
// 9am on June 1 in Tokyo.
const JUNE_1 = new Date( '2026-06-01T00:00:00Z' );

const SERIES: ComparativeLineChartSeries[] = [
	{
		label: 'Views',
		group: 'views',
		data: [
			{ date: JULY_1, value: 100 },
			{ date: JULY_2, value: 200 },
		],
	},
];

// An hour apart, so the library reads the series as hourly on its own.
const HOURLY_SERIES: ComparativeLineChartSeries[] = [
	{
		label: 'Views',
		group: 'views',
		data: [
			{ date: new Date( '2026-07-02T04:00:00Z' ), value: 100 },
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

type RecordedLineProps = {
	chartId?: string;
	defaultHiddenSeries?: readonly string[];
	legend: { collapseGroups: boolean; comparisonItem: boolean; interactive: boolean };
	margin?: Record< string, number >;
	options?: {
		yScale?: { domain?: [ number, number ]; zero?: boolean };
		axis: {
			y: {
				display?: boolean;
				tickValues?: number[];
				tickFormat: ( value: number ) => string;
			};
		};
	};
	renderTooltip: ( params: unknown ) => { props: DatedTooltipProps } | null;
	withTooltips: boolean;
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

type Entry = { datum: { date: Date; realDate?: Date; value?: number | null }; key: string };

/**
 * The model the chart's tooltip renders for the hovered entries; the first is
 * the hovered one.
 *
 * @param entries - The rows the chart reports at the hovered date.
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

	expect( tooltipNode?.props.indicatorType ).toBe( 'line' );
	return tooltipNode!.props.model;
}

/** A row's reading as `name`, `value`, and the comparison value when it has one. */
function readings( model: DatedTooltipModel ) {
	return model.rows.map( row => [ row.name, row.value, row.previous?.value ] );
}

describe( 'ComparativeLineChart', () => {
	beforeEach( () => {
		mockLineSpy.mockClear();
		mockLegendSpy.mockClear();
		mockChartHeight = Infinity;
	} );

	// `useChartMargin` sizes the gutters itself; overriding them here clipped the edge dates.
	it.each( [
		[ 'by default', DATA_FORMAT, false ],
		[ 'on a pinned domain', { type: 'percentage' as const, options: { decimals: 0 } }, false ],
		[ 'on a sparkline, which hides the y axis', DATA_FORMAT, true ],
	] )( 'never overrides the gutters the chart measured %s', ( _case, dataFormat, isSparkline ) => {
		mockChartHeight = isSparkline ? 80 : Infinity;

		render(
			<ComparativeLineChart
				series={ SERIES }
				dataFormat={ dataFormat }
				compactWhenShort={ isSparkline }
			/>
		);

		expect( recordedProps().margin ).toBeUndefined();
		expect( recordedProps().options.axis.y.display ).toBe( isSparkline ? false : undefined );
	} );

	describe( 'value axis baseline', () => {
		afterEach( () => {
			mockHiddenSeries = new Set();
		} );

		const STEADY: ComparativeLineChartSeries[] = [
			{
				label: 'Subscribers',
				group: 'subscribers',
				data: [
					{ date: JULY_1, value: 140 },
					{ date: JULY_2, value: 144 },
				],
			},
		];

		it( 'starts at zero by default and lets the chart fit the rest', () => {
			render( <ComparativeLineChart series={ STEADY } dataFormat={ DATA_FORMAT } /> );

			expect( recordedProps().options.yScale ).toEqual( { zero: true } );
		} );

		it( 'pins a padded domain for a cumulative metric', () => {
			render(
				<ComparativeLineChart series={ STEADY } dataFormat={ DATA_FORMAT } baseline="padded" />
			);

			expect( recordedProps().options.yScale ).toEqual( { domain: [ 136, 144 ] } );
		} );

		it( 'pads across every visible series', () => {
			render(
				<ComparativeLineChart
					series={ [ ...STEADY, ...SERIES ] }
					dataFormat={ DATA_FORMAT }
					baseline="padded"
				/>
			);

			expect( recordedProps().options.yScale ).toEqual( { domain: [ 80, 200 ] } );
		} );

		it( 'leaves a series the legend hid out of the padded domain', () => {
			mockHiddenSeries = new Set( [ 'Views' ] );
			render(
				<ComparativeLineChart
					series={ [ ...STEADY, ...SERIES ] }
					dataFormat={ DATA_FORMAT }
					baseline="padded"
				/>
			);

			expect( recordedProps().options.yScale ).toEqual( { domain: [ 136, 144 ] } );
		} );

		it( 'labels a small change on a large count in full so no two ticks repeat', () => {
			const large: ComparativeLineChartSeries[] = [
				{
					label: 'Subscribers',
					group: 'subscribers',
					data: [
						{ date: JULY_1, value: 4200 },
						{ date: JULY_2, value: 4210 },
					],
				},
			];
			render(
				<ComparativeLineChart series={ large } dataFormat={ DATA_FORMAT } baseline="padded" />
			);

			const { tickValues, tickFormat } = recordedProps().options.axis.y;
			expect( tickValues.map( tickFormat ) ).toEqual( [
				'4,190',
				'4,195',
				'4,200',
				'4,205',
				'4,210',
			] );
		} );

		it( 'keeps a percentage metric on 0 to 100% whatever the baseline', () => {
			render(
				<ComparativeLineChart
					series={ STEADY }
					dataFormat={ { type: 'percentage', options: { decimals: 0 } } }
					baseline="padded"
				/>
			);

			expect( recordedProps().options.yScale ).toEqual( { domain: [ 0, 1 ] } );
		} );

		it( 'keeps the empty-state axis for an all-zero period whatever the baseline', () => {
			const empty: ComparativeLineChartSeries[] = [
				{ label: 'Subscribers', group: 'subscribers', data: [ { date: JULY_1, value: 0 } ] },
			];
			render(
				<ComparativeLineChart series={ empty } dataFormat={ DATA_FORMAT } baseline="padded" />
			);

			expect( recordedProps().options.yScale ).toEqual( { domain: [ 0, 80 ] } );
		} );
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
			legend: { collapseGroups: true, comparisonItem: true, interactive: true },
		} );
		expect( mockLegendSpy ).toHaveBeenLastCalledWith(
			expect.objectContaining( {
				interactive: true,
				items: [
					{ label: 'Views', color: '#3858E9', interactive: false },
					{ label: 'Visitors', color: '#3858E9' },
				],
			} )
		);
	} );

	it( 'collapses a metric into one legend item and asks for the comparison item', () => {
		render( <ComparativeLineChart series={ SERIES_WITH_COMPARISON } dataFormat={ DATA_FORMAT } /> );

		expect( recordedProps().legend ).toEqual( {
			collapseGroups: true,
			comparisonItem: true,
			interactive: false,
		} );
	} );

	it( 'pairs a comparison row with its metric, under the comparison date', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render( <ComparativeLineChart series={ PAIRED_SERIES } dataFormat={ DATA_FORMAT } /> );

		const model = tooltipModelFor(
			{ datum: { date: JULY_1, value: 100 }, key: 'Views' },
			{ datum: COMPARISON_POINT, key: 'Views · previous period' },
			{ datum: { date: JULY_1, value: 40 }, key: 'Visitors' },
			{ datum: { ...COMPARISON_POINT, value: 30 }, key: 'Visitors · previous period' }
		);

		expect( model.date ).toBe( 'July 1, 2026' );
		expect( model.previousDate ).toBe( 'June 1, 2026' );
		expect( readings( model ) ).toEqual( [
			[ 'Views', 100, 80 ],
			[ 'Visitors', 40, 30 ],
		] );
	} );

	it( "hands each row its metric's count label, the comparison borrowing its group's", () => {
		const views = ( count: number ) =>
			/* translators: %s: number of views. */
			_n( '%s View', '%s Views', count, 'jetpack-premium-analytics-pkg' );
		const [ current, comparison ] = SERIES_WITH_COMPARISON;

		render(
			<ComparativeLineChart
				series={ [ { ...current, countLabel: views }, comparison ] }
				dataFormat={ DATA_FORMAT }
			/>
		);

		const model = tooltipModelFor(
			{ datum: { date: JULY_1, value: 1 }, key: 'Views' },
			{ datum: { ...COMPARISON_POINT, value: 2 }, key: 'Views · previous period' }
		);

		expect( model.rows ).toEqual( [
			expect.objectContaining( {
				name: 'Views',
				countLabel: views,
				previous: expect.objectContaining( { value: 2 } ),
			} ),
		] );
	} );

	it( "gives an extra's row its own count label and format, and no swatch", () => {
		const impressions = ( count: number ) =>
			/* translators: %s: number of impressions. */
			_n( '%s Impression', '%s Impressions', count, 'jetpack-premium-analytics-pkg' );

		render(
			<ComparativeLineChart
				series={ SERIES }
				dataFormat={ DATA_FORMAT }
				tooltipExtras={ [
					{ label: 'Impressions', data: [ { date: JULY_1, value: 1 } ], countLabel: impressions },
				] }
			/>
		);

		const [ views, extra ] = tooltipModelFor( {
			datum: { date: JULY_1, value: 1 },
			key: 'Views',
		} ).rows;

		expect( views ).toEqual( expect.objectContaining( { countLabel: undefined } ) );
		expect( views.indicator.kind ).toBe( 'series' );
		expect( extra ).toEqual(
			expect.objectContaining( { name: 'Impressions', value: 1, countLabel: impressions } )
		);
		expect( extra.indicator ).toEqual( { kind: 'blank' } );
	} );

	it( 'lists each drawn metric on a multi-metric chart with no comparison', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		const twoMetrics: ComparativeLineChartSeries[] = [
			{ label: 'Views', group: 'views', data: [ { date: JULY_1, value: 100 } ] },
			{ label: 'Visitors', group: 'visitors', data: [ { date: JULY_1, value: 40 } ] },
		];

		render( <ComparativeLineChart series={ twoMetrics } dataFormat={ DATA_FORMAT } /> );

		const model = tooltipModelFor(
			{ datum: { date: JULY_1, value: 100 }, key: 'Views' },
			{ datum: { date: JULY_1, value: 40 }, key: 'Visitors' }
		);

		expect( model.previousDate ).toBeUndefined();
		expect( readings( model ) ).toEqual( [
			[ 'Views', 100, undefined ],
			[ 'Visitors', 40, undefined ],
		] );
	} );

	it( "heads the tooltip with the point's date in the site's timezone", () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render( <ComparativeLineChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

		expect( tooltipModelFor( { datum: { date: JULY_2, value: 200 }, key: 'Views' } ).date ).toBe(
			'July 2, 2026'
		);
	} );

	// A date alone names 24 hourly buckets, so it cannot identify the one hovered
	// — and the hour it gains has to be the one the axis tick under it shows.
	it( 'adds the hour the point names at the hourly resolution', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render(
			<ComparativeLineChart series={ SERIES } dataFormat={ DATA_FORMAT } tickResolution="hour" />
		);

		expect( tooltipModelFor( { datum: { date: JULY_2, value: 200 }, key: 'Views' } ).date ).toBe(
			'July 2, 2026 2:00 pm'
		);
	} );

	// Most widgets declare no resolution, so reading the caller's prop alone left
	// an hourly series naming all 24 of a day's points with the same date.
	it( 'adds the hour for an hourly series that declares no resolution', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render( <ComparativeLineChart series={ HOURLY_SERIES } dataFormat={ DATA_FORMAT } /> );

		expect( tooltipModelFor( { datum: { date: JULY_2, value: 200 }, key: 'Views' } ).date ).toBe(
			'July 2, 2026 2:00 pm'
		);
	} );

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

		expect( tooltipModelFor( { datum: { date: JULY_2, value: 200 }, key: 'Views' } ).date ).toBe(
			'the bucket'
		);
		expect( formatTooltipDate ).toHaveBeenCalledWith( JULY_2, 'dateTime' );
	} );

	it( 'heads the comparison column with its own date, not the axis date it shares', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render(
			<ComparativeLineChart
				series={ SERIES_WITH_COMPARISON }
				dataFormat={ DATA_FORMAT }
				tickResolution="hour"
			/>
		);

		// Reading `datum.date` here would repeat the current period's date on both
		// columns; the point of `realDate` is that the previous period keeps its own.
		const model = tooltipModelFor(
			{ datum: { date: JULY_1, value: 100 }, key: 'Views' },
			{ datum: COMPARISON_POINT, key: 'Views · previous period' }
		);

		expect( model.previousDate ).toBe( 'June 1, 2026 9:00 am' );
	} );
} );

describe( 'ComparativeLineChart tooltip extras', () => {
	const CURRENCY = { type: 'currency' as const, options: { decimals: 2 } };
	const CPM_EXTRA = {
		label: 'Average CPM',
		data: [ { date: JULY_1, value: 0.15 } ],
		dataFormat: CURRENCY,
	};
	const HOVERED_VIEWS = { datum: { date: JULY_1, value: 100 }, key: 'Views' };

	beforeEach( () => {
		mockLineSpy.mockClear();
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
	} );

	it( "lists each extra's point for the hovered date after the drawn rows, in its own format", () => {
		render(
			<ComparativeLineChart
				series={ SERIES }
				dataFormat={ DATA_FORMAT }
				tooltipExtras={ [ CPM_EXTRA ] }
			/>
		);

		const model = tooltipModelFor( HOVERED_VIEWS );

		expect( readings( model ) ).toEqual( [
			[ 'Views', 100, undefined ],
			[ 'Average CPM', 0.15, undefined ],
		] );
		expect( model.rows[ 1 ].dataFormat ).toEqual( CURRENCY );
		expect( model.rows[ 0 ].dataFormat ).toEqual( DATA_FORMAT );
	} );

	it( "reads an extra's comparison point beside it", () => {
		render(
			<ComparativeLineChart
				series={ SERIES_WITH_COMPARISON }
				dataFormat={ DATA_FORMAT }
				tooltipExtras={ [
					{ ...CPM_EXTRA, previous: [ { date: JULY_1, realDate: JUNE_1, value: 0.1 } ] },
				] }
			/>
		);

		const model = tooltipModelFor( HOVERED_VIEWS, {
			datum: COMPARISON_POINT,
			key: 'Views · previous period',
		} );

		expect( readings( model ) ).toEqual( [
			[ 'Views', 100, 80 ],
			[ 'Average CPM', 0.15, 0.1 ],
		] );
	} );

	it( 'skips an extra with no point for the hovered date', () => {
		render(
			<ComparativeLineChart
				series={ SERIES }
				dataFormat={ DATA_FORMAT }
				tooltipExtras={ [ CPM_EXTRA ] }
			/>
		);

		expect(
			readings( tooltipModelFor( { datum: { date: JULY_2, value: 200 }, key: 'Views' } ) )
		).toEqual( [ [ 'Views', 200, undefined ] ] );
	} );

	it( 'keeps the swatch of a drawn series that is also listed as an extra', () => {
		// A counterpart in `MetricTabsChart` is drawn (hidden until revealed) and
		// listed; once the chart reports it, it must not turn into a blank row.
		const twoMetrics: ComparativeLineChartSeries[] = [
			{ label: 'Views', group: 'views', data: [ { date: JULY_1, value: 100 } ] },
			{ label: 'Visitors', group: 'visitors', data: [ { date: JULY_1, value: 40 } ] },
		];
		render(
			<ComparativeLineChart
				series={ twoMetrics }
				dataFormat={ DATA_FORMAT }
				tooltipExtras={ [ { label: 'Visitors', data: twoMetrics[ 1 ].data }, CPM_EXTRA ] }
			/>
		);

		const model = tooltipModelFor( HOVERED_VIEWS, {
			datum: { date: JULY_1, value: 40 },
			key: 'Visitors',
		} );

		expect( model.rows.map( row => [ row.name, row.indicator.kind ] ) ).toEqual( [
			[ 'Views', 'series' ],
			[ 'Visitors', 'series' ],
			[ 'Average CPM', 'blank' ],
		] );
	} );

	it( 'leaves the tooltip alone without extras', () => {
		render( <ComparativeLineChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

		expect( readings( tooltipModelFor( HOVERED_VIEWS ) ) ).toEqual( [
			[ 'Views', 100, undefined ],
		] );
	} );

	it( 'keeps the tooltip on for an all-zero drawn series once an extra has data', () => {
		const zeroSeries: ComparativeLineChartSeries[] = [
			{ label: 'Revenue', group: 'revenue', data: [ { date: JULY_1, value: 0 } ] },
		];

		render( <ComparativeLineChart series={ zeroSeries } dataFormat={ DATA_FORMAT } /> );
		expect( recordedProps().withTooltips ).toBe( false );

		render(
			<ComparativeLineChart
				series={ zeroSeries }
				dataFormat={ DATA_FORMAT }
				tooltipExtras={ [ { ...CPM_EXTRA, data: [ { date: JULY_1, value: 0 } ] } ] }
			/>
		);
		expect( recordedProps().withTooltips ).toBe( false );

		render(
			<ComparativeLineChart
				series={ zeroSeries }
				dataFormat={ DATA_FORMAT }
				tooltipExtras={ [ CPM_EXTRA ] }
			/>
		);
		expect( recordedProps().withTooltips ).toBe( true );
	} );
} );
