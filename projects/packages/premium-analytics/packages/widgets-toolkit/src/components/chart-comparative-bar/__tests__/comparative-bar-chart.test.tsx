/**
 * External dependencies
 */
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ComparativeBarChart } from '../comparative-bar-chart';
import type { ComparativeBarChartSeries } from '../types';

// Record the options handed to the underlying chart. The real one renders SVG
// through a provider jsdom cannot lay out, and what matters here is the option
// object this wrapper composes.
const mockBarSpy = jest.fn();

jest.mock( '@jetpack-premium-analytics/externals', () => {
	const { forwardRef } = jest.requireActual( 'react' );

	const BarChart = ( props: Record< string, unknown > ) => {
		mockBarSpy( props );
		return <div data-testid="bar-chart" />;
	};
	BarChart.Legend = () => null;

	return {
		BarChart,
		// The wrapper measures this element, so the stand-in must take the ref.
		Stack: forwardRef(
			(
				{ children }: { children?: React.ReactNode },
				ref: React.ForwardedRef< HTMLDivElement >
			) => <div ref={ ref }>{ children }</div>
		),
		useGlobalChartsContext: () => ( { getElementStyles: () => ( { color: '#3858E9' } ) } ),
	};
} );

const DATA_FORMAT = { type: 'number' as const, options: { decimals: 0 } };

const JULY_1 = new Date( '2026-07-01T00:00:00Z' );
const JULY_2 = new Date( '2026-07-02T00:00:00Z' );

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

/**
 * The options the most recent chart render received.
 *
 * @return The recorded chart options.
 */
function recordedOptions(): Record< string, never > & {
	axis: { x: Record< string, unknown >; y: Record< string, unknown > };
} {
	return mockBarSpy.mock.calls.at( -1 )?.[ 0 ].options;
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
	const tooltipRenderer = mockBarSpy.mock.calls.at( -1 )?.[ 0 ].renderTooltip;
	const hovered = { date: hoveredDate, value: 100 };

	const tooltipNode = tooltipRenderer( {
		tooltipData: {
			nearestDatum: { datum: hovered, key: 'July' },
			datumByKey: { July: { datum: hovered, index: 0, key: 'July' } },
		},
	} );

	const datumByKey = tooltipNode.props.tooltipData.datumByKey as Record<
		string,
		{ datum: { value: number } }
	>;
	/* eslint-enable testing-library/render-result-naming-convention */

	return Object.fromEntries(
		Object.entries( datumByKey ).map( ( [ key, entry ] ) => [ key, entry.datum.value ] )
	);
}

describe( 'ComparativeBarChart', () => {
	beforeEach( () => {
		mockBarSpy.mockClear();
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
} );
