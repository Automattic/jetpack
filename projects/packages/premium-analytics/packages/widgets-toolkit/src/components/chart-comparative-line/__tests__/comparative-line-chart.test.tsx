/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import { getSettings, setSettings } from '@wordpress/date';
import { _n } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	mockLineChartLegendSpy,
	mockLineChartSpy,
	resetMockCharts,
	setMockChartHeight,
	setMockHiddenSeries,
} from '../../../../../../tests/js/chart-test-utils';
import { siteSettingsIn } from '../../../__fixtures__/wp-date-settings';
import { ComparativeLineChart } from '../comparative-line-chart';
import type { ComparativeLineChartSeries } from '../types';

jest.mock( '@jetpack-premium-analytics/externals', () =>
	jest.requireActual( '../../../../../../tests/js/chart-test-utils' ).mockChartExternals()
);

jest.mock(
	'@wordpress/compose',
	() => jest.requireActual( '../../../../../../tests/js/chart-test-utils' ).mockWordPressCompose
);

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

type GetTooltipLabel = (
	datum: { date: Date; realDate?: Date },
	index: number,
	key: string,
	value: string,
	rawValue?: number
) => string;

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
	renderTooltip: ( params: unknown ) => {
		props: { getLabel: GetTooltipLabel; layout?: string };
	};
	withTooltips: boolean;
};

/**
 * The props the underlying chart last rendered with.
 *
 * @return The recorded props.
 */
function recordedProps(): RecordedLineProps {
	expect( mockLineChartSpy ).toHaveBeenCalled();
	return mockLineChartSpy.mock.calls.at( -1 )[ 0 ];
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
 * @param value          - Its value, as the tooltip spelled it out.
 * @param rawValue       - The number `value` spells.
 * @return The rendered row label.
 */
function tooltipLabelFor(
	datum: { date: Date; realDate?: Date },
	index = 0,
	key = 'Views',
	value = '100',
	rawValue?: number
): string {
	/* eslint-disable testing-library/render-result-naming-convention --
	   This is the chart's `renderTooltip` prop and its return value, not
	   testing-library's `render()`; the rule matches on the name alone. */
	const tooltipNode = recordedProps().renderTooltip( {
		tooltipData: { datumByKey: { [ key ]: { datum, index, key } } },
	} );

	return tooltipNode.props.getLabel( datum, index, key, value, rawValue );
	/* eslint-enable testing-library/render-result-naming-convention */
}

describe( 'ComparativeLineChart', () => {
	const originalSettings = getSettings();

	beforeEach( () => {
		resetMockCharts();
	} );

	afterEach( () => {
		setSettings( originalSettings );
	} );

	// `useChartMargin` sizes the gutters itself; overriding them here clipped the edge dates.
	it.each( [
		[ 'by default', DATA_FORMAT, false ],
		[ 'on a pinned domain', { type: 'percentage' as const, options: { decimals: 0 } }, false ],
		[ 'on a sparkline, which hides the y axis', DATA_FORMAT, true ],
	] )( 'never overrides the gutters the chart measured %s', ( _case, dataFormat, isSparkline ) => {
		setMockChartHeight( isSparkline ? 80 : Infinity );

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
			setMockHiddenSeries( [ 'Views' ] );
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
		expect( mockLineChartLegendSpy ).toHaveBeenLastCalledWith(
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

	it( 'names a paired row after its metric, not after its own label', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render( <ComparativeLineChart series={ PAIRED_SERIES } dataFormat={ DATA_FORMAT } /> );

		expect( tooltipLabelFor( { date: JULY_1 }, 2, 'Visitors', '40' ) ).toBe(
			'40 Visitors · July 1, 2026'
		);
		// The comparison row borrows its group's current-period name rather than
		// leading with 'Visitors · previous period'.
		expect( tooltipLabelFor( COMPARISON_POINT, 3, 'Visitors · previous period', '30' ) ).toBe(
			'30 Visitors · June 1, 2026'
		);
	} );

	it( "reads a count metric's rows in the plural form each count calls for", () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
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

		expect( tooltipLabelFor( { date: JULY_1 }, 0, 'Views', '1', 1 ) ).toBe(
			'1 View · July 1, 2026'
		);
		// The comparison row has no count label of its own and borrows its group's.
		expect( tooltipLabelFor( COMPARISON_POINT, 1, 'Views · previous period', '2', 2 ) ).toBe(
			'2 Views · June 1, 2026'
		);
	} );

	it( "reads an extra's row with the extra's own count label", () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
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

		expect( tooltipLabelFor( { date: JULY_1 }, 1, 'Impressions', '1', 1 ) ).toBe(
			'1 Impression · July 1, 2026'
		);
		// The drawn series has no count label, so its name stays the unit.
		expect( tooltipLabelFor( { date: JULY_1 }, 0, 'Views', '1', 1 ) ).toBe(
			'1 Views · July 1, 2026'
		);
	} );

	// The name is the value's unit, so a single metric with no comparison keeps
	// it too: `100 · July 2, 2026` would leave the reader guessing what 100 is.
	it( "reads a row as value, metric, then the point's date in the site's timezone", () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render( <ComparativeLineChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

		expect( tooltipLabelFor( { date: JULY_2 } ) ).toBe( '100 Views · July 2, 2026' );
	} );

	it( 'renders the rows inline, the value spelled into each label', () => {
		render( <ComparativeLineChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

		/* eslint-disable testing-library/render-result-naming-convention --
		   The chart's `renderTooltip` prop, not testing-library's `render()`. */
		const tooltipNode = recordedProps().renderTooltip( {
			tooltipData: { datumByKey: { Views: { datum: { date: JULY_1 }, index: 0, key: 'Views' } } },
		} );
		/* eslint-enable testing-library/render-result-naming-convention */

		expect( tooltipNode.props.layout ).toBe( 'inline' );
	} );

	// A date alone names 24 hourly buckets, so it cannot identify the one hovered
	// — and the hour it gains has to be the one the axis tick under it shows.
	it( 'adds the hour the point names at the hourly resolution', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render(
			<ComparativeLineChart series={ SERIES } dataFormat={ DATA_FORMAT } tickResolution="hour" />
		);

		expect( tooltipLabelFor( { date: JULY_2 } ) ).toBe( '100 Views · July 2, 2026 2:00 pm' );
	} );

	// Most widgets declare no resolution, so reading the caller's prop alone left
	// an hourly series naming all 24 of a day's points with the same date.
	it( 'adds the hour for an hourly series that declares no resolution', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render( <ComparativeLineChart series={ HOURLY_SERIES } dataFormat={ DATA_FORMAT } /> );

		expect( tooltipLabelFor( { date: JULY_2 } ) ).toBe( '100 Views · July 2, 2026 2:00 pm' );
	} );

	// How a point's date reads is the caller's to decide; which format names it
	// stays here.
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

		expect( tooltipLabelFor( { date: JULY_2 } ) ).toBe( '100 Views · the bucket' );
		expect( formatTooltipDate ).toHaveBeenCalledWith( JULY_2, 'dateTime' );
	} );

	it( 'labels a comparison row from its own date, not the axis date it shares', () => {
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
		render(
			<ComparativeLineChart series={ SERIES } dataFormat={ DATA_FORMAT } tickResolution="hour" />
		);

		// Reading `datum.date` here would repeat the current period's date on both
		// rows; the point of `realDate` is that the previous period keeps its own.
		expect( tooltipLabelFor( COMPARISON_POINT, 1, 'Views', '80' ) ).toBe(
			'80 Views · June 1, 2026 9:00 am'
		);
	} );
} );

describe( 'ComparativeLineChart tooltip extras', () => {
	const CURRENCY = { type: 'currency' as const, options: { decimals: 2 } };
	const CPM_EXTRA = {
		label: 'Average CPM',
		data: [ { date: JULY_1, value: 0.15 } ],
		dataFormat: CURRENCY,
	};

	type TooltipNode = {
		props: {
			tooltipData: { datumByKey: Record< string, { datum: unknown; index: number; key: string } > };
			supplementaryRows?: Record< string, unknown >;
			getLabel: GetTooltipLabel;
		};
	};

	/** Run the chart's `renderTooltip` for a hovered primary point. */
	function tooltipFor( hoveredDate: Date ): TooltipNode {
		const hovered = { date: hoveredDate, value: 100 };

		const tooltipNode = (
			recordedProps().renderTooltip as unknown as ( params: unknown ) => TooltipNode
		 )( {
			tooltipData: {
				nearestDatum: { datum: hovered, key: 'Views' },
				datumByKey: { Views: { datum: hovered, index: 0, key: 'Views' } },
			},
		} );

		return tooltipNode;
	}

	const originalSettings = getSettings();

	beforeEach( () => {
		resetMockCharts();
		setSettings( siteSettingsIn( 'Asia/Tokyo' ) );
	} );

	afterEach( () => {
		setSettings( originalSettings );
	} );

	it( "lists each extra's point for the hovered date as a supplementary row", () => {
		render(
			<ComparativeLineChart
				series={ SERIES }
				dataFormat={ DATA_FORMAT }
				tooltipExtras={ [ CPM_EXTRA ] }
			/>
		);

		const { tooltipData, supplementaryRows } = tooltipFor( JULY_1 ).props;

		expect( tooltipData.datumByKey[ 'Average CPM' ] ).toEqual( {
			datum: { date: JULY_1, value: 0.15 },
			index: 0,
			key: 'Average CPM',
		} );
		expect( supplementaryRows ).toEqual( { 'Average CPM': CURRENCY } );
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
