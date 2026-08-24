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
	// 9am on June 1 in Tokyo.
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
