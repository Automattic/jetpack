/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import { setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { siteSettingsIn } from '../../../__fixtures__/wp-date-settings';
import { ComparativeBarChart } from '../comparative-bar-chart';
import type { ComparativeBarChartSeries } from '../types';

// Record the options handed to the underlying chart. The real one renders SVG
// through a provider jsdom cannot lay out, and what matters here is the option
// object this wrapper composes.
const mockBarSpy = jest.fn();

jest.mock( '@jetpack-premium-analytics/externals', () => {
	const { forwardRef } = jest.requireActual( 'react' );

	const BarChart = ( props: { children?: React.ReactNode } ) => {
		mockBarSpy( props );
		// Render children so the legend, which the wrapper mounts conditionally,
		// is observable.
		return <div data-testid="bar-chart">{ props.children }</div>;
	};
	BarChart.Legend = () => <div data-testid="bar-chart-legend" />;

	return {
		BarChart,
		// The wrapper measures this element, so the stand-in must take the ref.
		Stack: forwardRef(
			(
				{ children }: { children?: React.ReactNode },
				ref: React.ForwardedRef< HTMLDivElement >
			) => <div ref={ ref }>{ children }</div>
		),
		// Mirrors the real theme: a comparison series shares its primary's colour
		// and is set apart only by opacity.
		useGlobalChartsContext: () => ( {
			getElementStyles: ( { data }: { data: { options?: { type?: string } } } ) => ( {
				color: '#3858E9',
				barStyles: data?.options?.type === 'comparison' ? { widthFactor: 1.5, opacity: 0.5 } : {},
			} ),
		} ),
	};
} );

// jsdom's ResizeObserver is a no-op stub, so the real hook's callback never
// fires and the chart would measure as infinitely tall in every test — leaving
// the whole `compactWhenShort` branch unreachable. Drive the height instead.
let mockChartHeight = Infinity;

jest.mock( '@wordpress/compose', () => ( {
	// Spread the real module: `@wordpress/data` is pulled in transitively and
	// needs `createHigherOrderComponent` from here.
	...jest.requireActual( '@wordpress/compose' ),
	useResizeObserver:
		( onResize: ( entries: { contentRect: { height: number } }[] ) => void ) =>
		( element: HTMLElement | null ) => {
			if ( element ) {
				onResize( [ { contentRect: { height: mockChartHeight } } ] );
			}
		},
} ) );

const DATA_FORMAT = { type: 'number' as const, options: { decimals: 0 } };

const JULY_1 = new Date( '2026-07-01T00:00:00Z' );
const JULY_2 = new Date( '2026-07-02T00:00:00Z' );

// A chart point is a wall clock, so a label assertion builds one from local
// parts — the same way `toChartDate` builds them — rather than from an instant.
const JULY_2_2PM = new Date( 2026, 6, 2, 14, 0 );

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

/** The props `ComparativeBarChart` hands to `ChartTooltip`. */
type TooltipProps = {
	tooltipData: { datumByKey: Record< string, { datum: { value: number } } > };
	seriesStyles: { stroke: string; opacity?: number }[];
	getLabel: ( datum: { date?: Date; realDate?: Date }, index: number, key: string ) => string;
};

/**
 * Every prop the most recent chart render received.
 *
 * @return The recorded props.
 */
function recordedProps(): {
	options: {
		axis: { x: Record< string, unknown >; y: Record< string, unknown > };
		yScale?: { domain: [ number, number ] };
	};
	margin: { left?: number; right: number };
	gridVisibility?: string;
	showZeroValues?: boolean;
	withTooltips: boolean;
	renderTooltip: ( params: unknown ) => { props: TooltipProps };
} {
	// Fail on the real reason rather than a TypeError further down.
	expect( mockBarSpy ).toHaveBeenCalled();
	return mockBarSpy.mock.calls.at( -1 )[ 0 ];
}

/**
 * The options the most recent chart render received.
 *
 * @return The recorded chart options.
 */
function recordedOptions() {
	return recordedProps().options;
}

/**
 * Run the chart's `renderTooltip` for a hovered primary point and report the
 * tooltip rows it produced, as `label → value`.
 *
 * @param hoveredDate - The category the pointer (or keyboard focus) is on.
 * @return One entry per tooltip row.
 */
function tooltipRowsFor( hoveredDate: Date ): Record< string, number > {
	/* eslint-disable testing-library/render-result-naming-convention --
	   These are the chart's `renderTooltip` prop and its return value, not
	   testing-library's `render()`; the rule matches on the name alone. */
	const tooltipRenderer = recordedProps().renderTooltip;
	const hovered = { date: hoveredDate, value: 100 };

	const tooltipNode = tooltipRenderer( {
		tooltipData: {
			nearestDatum: { datum: hovered, key: 'July' },
			datumByKey: { July: { datum: hovered, index: 0, key: 'July' } },
		},
	} );

	const { datumByKey } = tooltipNode.props.tooltipData;
	/* eslint-enable testing-library/render-result-naming-convention */

	return Object.fromEntries(
		Object.entries( datumByKey ).map( ( [ key, entry ] ) => [ key, entry.datum.value ] )
	);
}

/**
 * The label the tooltip puts on a hovered point.
 *
 * @param hoveredDate - The point's date.
 * @return The rendered row label.
 */
function tooltipLabelFor( hoveredDate: Date ): string {
	/* eslint-disable testing-library/render-result-naming-convention --
	   As above: this is the chart's `renderTooltip` prop, not testing-library's
	   `render()`. */
	const tooltipRenderer = recordedProps().renderTooltip;
	const hovered = { date: hoveredDate, value: 100 };

	const tooltipNode = tooltipRenderer( {
		tooltipData: {
			nearestDatum: { datum: hovered, key: 'July' },
			datumByKey: { July: { datum: hovered, index: 0, key: 'July' } },
		},
	} );

	return tooltipNode.props.getLabel( hovered, 0, 'July' );
	/* eslint-enable testing-library/render-result-naming-convention */
}

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
	beforeEach( () => {
		mockBarSpy.mockClear();
		mockChartHeight = Infinity;
	} );

	it( 'omits the x tickFormat key when no tick format is requested', () => {
		render( <ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

		// The bar chart spreads these options over its own defaults, so an explicit
		// `tickFormat: undefined` would erase its date formatter and leave the axis
		// rendering raw `Date.toString()` values.
		expect( recordedOptions().axis.x ).not.toHaveProperty( 'tickFormat' );
	} );

	it( 'passes an x tickFormat when one is requested', () => {
		render(
			<ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } tickFormat="short" />
		);

		expect( typeof recordedOptions().axis.x.tickFormat ).toBe( 'function' );
	} );

	it( 'declares the bucket size to the x-axis', () => {
		render(
			<ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } tickResolution="hour" />
		);

		// Two hourly points an hour apart are also two daily points 24 hours apart
		// as far as gap-measuring goes, so the axis needs telling which it is.
		expect( recordedOptions().axis.x.tickResolution ).toBe( 'hour' );
	} );

	// Two site timezones, so the assertion holds whatever zone the machine
	// running the suite is in: a label naming the point's own wall clock cannot
	// depend on either zone, while one resolved in the site's follows it.
	it.each( [ 'Asia/Tokyo', 'America/Los_Angeles' ] )(
		'labels a tooltip with the bucket the point names, on a site in %s',
		siteZone => {
			setSettings( siteSettingsIn( siteZone ) );
			render( <ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

			expect( tooltipLabelFor( JULY_2_2PM ) ).toBe( 'July 2, 2026' );
		}
	);

	// A date alone names 24 hourly buckets, so it cannot identify the one hovered
	// — and the hour it gains has to be the one the axis tick under it shows.
	it.each( [ 'Asia/Tokyo', 'America/Los_Angeles' ] )(
		'adds the hour the point names at the hourly resolution, on a site in %s',
		siteZone => {
			setSettings( siteSettingsIn( siteZone ) );
			render(
				<ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } tickResolution="hour" />
			);

			expect( tooltipLabelFor( JULY_2_2PM ) ).toBe( 'July 2, 2026 2:00 pm' );
		}
	);

	it( 'adds the previous-period value to the tooltip when comparing', () => {
		render( <ComparativeBarChart series={ SERIES_WITH_COMPARISON } dataFormat={ DATA_FORMAT } /> );

		// The chart hands a custom tooltip renderer only the primary series, so
		// without re-pairing here the shadow bar's value would be unreadable —
		// including to screen readers, which get the same tooltip content.
		expect( tooltipRowsFor( JULY_1 ) ).toEqual( { July: 100, June: 80 } );
		expect( tooltipRowsFor( JULY_2 ) ).toEqual( { July: 100, June: 120 } );
	} );

	it( 'leaves the tooltip alone when there is no comparison series', () => {
		render( <ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

		expect( tooltipRowsFor( JULY_1 ) ).toEqual( { July: 100 } );
	} );

	it( 'always formats the y axis', () => {
		render( <ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

		expect( typeof recordedOptions().axis.y.tickFormat ).toBe( 'function' );
	} );

	it( 'dims the previous-period swatch to match the shadow bar it stands for', () => {
		render( <ComparativeBarChart series={ SERIES_WITH_COMPARISON } dataFormat={ DATA_FORMAT } /> );

		/* eslint-disable-next-line testing-library/render-result-naming-convention --
		   This is the chart's `renderTooltip` prop, not testing-library's `render()`. */
		const tooltip = recordedProps().renderTooltip( {
			tooltipData: { nearestDatum: { datum: { date: JULY_1, value: 100 }, key: 'July' } },
		} );

		// Both series share a colour, so opacity is the only thing telling the two
		// swatches apart — without it the tooltip shows two identical squares.
		expect( tooltip.props.seriesStyles ).toEqual( [
			{ stroke: '#3858E9', opacity: undefined },
			{ stroke: '#3858E9', opacity: 0.5 },
		] );
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

		it( 'reserves a left margin for a pinned domain', () => {
			render( <ComparativeBarChart series={ ZERO_SERIES } dataFormat={ DATA_FORMAT } /> );

			// `useChartMargin` sizes the gutter from the data's own min/max, so the
			// pinned domain's widest tick would otherwise be clipped.
			expect( recordedProps().margin.left ).toBeGreaterThan( 0 );
		} );

		it( 'lets the chart scale to the data otherwise', () => {
			render( <ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

			expect( recordedOptions() ).not.toHaveProperty( 'yScale' );
			expect( recordedProps().margin ).toEqual( { right: 0 } );
		} );
	} );

	describe( 'compactWhenShort', () => {
		it( 'degrades to a sparkline on a short tile', () => {
			mockChartHeight = 80;
			render(
				<ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } compactWhenShort />
			);

			expect( recordedOptions().axis.y.display ).toBe( false );
			expect( recordedProps().gridVisibility ).toBe( 'none' );
			// The hidden axis frees its gutter for the bars.
			expect( recordedProps().margin ).toEqual( { right: 0, left: 0 } );
			expect( screen.queryByTestId( 'bar-chart-legend' ) ).not.toBeInTheDocument();
		} );

		it( 'keeps the axis, grid, and legend when the tile is tall enough', () => {
			mockChartHeight = 400;
			render(
				<ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } compactWhenShort />
			);

			expect( recordedOptions().axis.y ).not.toHaveProperty( 'display' );
			expect( recordedProps().gridVisibility ).toBeUndefined();
			expect( screen.getByTestId( 'bar-chart-legend' ) ).toBeInTheDocument();
		} );

		it( 'ignores the breakpoint when not opted in', () => {
			mockChartHeight = 80;
			render( <ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

			expect( recordedOptions().axis.y ).not.toHaveProperty( 'display' );
			expect( recordedProps().gridVisibility ).toBeUndefined();
		} );
	} );
} );
