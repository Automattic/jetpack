/**
 * External dependencies
 */
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ComparativeLineChart } from '../comparative-line-chart';
import type { ComparativeLineChartSeries } from '../types';

// Record the props handed to the underlying chart. The real one renders SVG
// through a provider jsdom cannot lay out, and what matters here is the tooltip
// renderer this wrapper composes.
const mockLineSpy = jest.fn();

jest.mock( '@jetpack-premium-analytics/externals', () => {
	const { forwardRef } = jest.requireActual( 'react' );

	const LineChart = ( props: { children?: React.ReactNode } ) => {
		mockLineSpy( props );
		return <div data-testid="line-chart">{ props.children }</div>;
	};
	LineChart.Legend = () => <div data-testid="line-chart-legend" />;

	return {
		LineChart,
		// The wrapper measures this element, so the stand-in must take the ref.
		Stack: forwardRef(
			(
				{ children }: { children?: React.ReactNode },
				ref: React.ForwardedRef< HTMLDivElement >
			) => <div ref={ ref }>{ children }</div>
		),
	};
} );

// Which formatter the tooltip reaches for is the decision under test; how each
// one renders is covered where they live. Stubbing both keeps these assertions
// off the zone of whatever machine runs the suite.
jest.mock( '@jetpack-premium-analytics/formatters', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/formatters' ),
	formatDate: ( date: Date, name = 'medium' ) => `site:${ name }:${ date.toISOString() }`,
	formatViewerDate: ( date: Date, name = 'medium' ) => `viewer:${ name }:${ date.toISOString() }`,
} ) );

jest.mock( '../../../hooks', () => ( {
	useSeriesStyles: () => [],
} ) );

const DATA_FORMAT = { type: 'number' as const, options: { decimals: 0 } };

const JULY_1 = new Date( '2026-07-01T00:00:00Z' );
const JULY_2 = new Date( '2026-07-02T00:00:00Z' );

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

// A comparison point carries the primary axis date, with the real
// previous-period date in `realDate`; that is what `alignSeriesDates` does.
const COMPARISON_POINT = {
	date: JULY_1,
	realDate: new Date( '2026-06-01T00:00:00Z' ),
	value: 80,
};

type TooltipProps = {
	getLabel: ( datum: { date: Date; realDate?: Date }, index: number ) => string;
};

/**
 * The label the tooltip puts on a point, at a given series index. Index 0 is the
 * current period; anything higher is a comparison series.
 *
 * @param datum          - The hovered point.
 * @param datum.date     - The axis date it is plotted on.
 * @param datum.realDate - Its own date, when it belongs to a comparison series.
 * @param index          - Its series index.
 * @return The rendered row label.
 */
function tooltipLabelFor( datum: { date: Date; realDate?: Date }, index = 0 ): string {
	/* eslint-disable testing-library/render-result-naming-convention --
	   This is the chart's `renderTooltip` prop and its return value, not
	   testing-library's `render()`; the rule matches on the name alone. */
	expect( mockLineSpy ).toHaveBeenCalled();
	const tooltipRenderer = mockLineSpy.mock.calls.at( -1 )[ 0 ].renderTooltip;

	const tooltipNode = tooltipRenderer( {
		tooltipData: { datumByKey: { July: { datum, index, key: 'July' } } },
	} ) as { props: TooltipProps };

	return tooltipNode.props.getLabel( datum, index );
	/* eslint-enable testing-library/render-result-naming-convention */
}

describe( 'ComparativeLineChart', () => {
	beforeEach( () => {
		mockLineSpy.mockClear();
	} );

	it( 'labels a tooltip with the site-zone date alone by default', () => {
		render( <ComparativeLineChart series={ SERIES } dataFormat={ DATA_FORMAT } /> );

		expect( tooltipLabelFor( { date: JULY_2 } ) ).toBe( `site:medium:${ JULY_2.toISOString() }` );
	} );

	// A date alone names 24 hourly buckets, so it cannot identify the one hovered
	// — and the time it gains has to be read in the zone the points were laid out
	// in, or it names an hour the axis under it does not agree with.
	it( 'adds the time, in the viewer zone, at the hourly resolution', () => {
		render(
			<ComparativeLineChart series={ SERIES } dataFormat={ DATA_FORMAT } tickResolution="hour" />
		);

		expect( tooltipLabelFor( { date: JULY_2 } ) ).toBe(
			`viewer:dateTime:${ JULY_2.toISOString() }`
		);
	} );

	it( 'labels a comparison row from its own date, not the axis date it shares', () => {
		render(
			<ComparativeLineChart series={ SERIES } dataFormat={ DATA_FORMAT } tickResolution="hour" />
		);

		// Reading `datum.date` here would repeat the current period's date on both
		// rows; the point of `realDate` is that the previous period keeps its own.
		expect( tooltipLabelFor( COMPARISON_POINT, 1 ) ).toBe(
			`viewer:dateTime:${ COMPARISON_POINT.realDate.toISOString() }`
		);
	} );
} );
