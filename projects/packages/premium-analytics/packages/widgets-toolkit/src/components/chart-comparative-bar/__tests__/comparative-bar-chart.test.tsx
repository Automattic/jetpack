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

const SERIES: ComparativeBarChartSeries[] = [
	{
		label: 'July',
		group: 'views',
		data: [
			{ date: new Date( '2026-07-01T00:00:00Z' ), value: 100 },
			{ date: new Date( '2026-07-02T00:00:00Z' ), value: 200 },
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

	it( 'always formats the y axis', () => {
		render( <ComparativeBarChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

		expect( typeof recordedOptions().axis.y.tickFormat ).toBe( 'function' );
	} );
} );
