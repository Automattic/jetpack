/**
 * External dependencies
 */
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import TrafficChartRender from '../render';
import useTrafficChart from '../use-traffic-chart';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '../use-traffic-chart' );

// The click lands in the date-filter controller, so a recorder stands in for it.
const mockDrillDown = jest.fn();
jest.mock( '@jetpack-premium-analytics/routing', () => ( {
	useReportDateFilters: () => ( {
		drillDown: ( ...args: unknown[] ) => mockDrillDown( ...args ),
	} ),
} ) );

// The chart itself is not this file's subject: the bucket the widget resolves is,
// and `useTrafficChart` is where it lands. The stand-in records its props so the
// click handler the widget hands it can be driven.
const mockMetricTabsChart = jest.fn();
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	MetricTabsChart: ( props: unknown ) => {
		mockMetricTabsChart( props );
		return null;
	},
} ) );

const mockUseTrafficChart = jest.mocked( useTrafficChart );

// `normalizeReportParams` coerces away an interval the range disallows, so each
// one needs a range long enough to survive reaching the widget.
const RANGE_FOR_INTERVAL: Record< string, { from: string; to: string } > = {
	hour: { from: '2026-06-29', to: '2026-06-30' },
	day: { from: '2026-06-01', to: '2026-06-30' },
	week: { from: '2026-01-01', to: '2026-06-30' },
	month: { from: '2025-01-01', to: '2026-06-30' },
	year: { from: '2023-01-01', to: '2026-06-30' },
};

function reportParams( interval: string ): ReportParams {
	return { ...RANGE_FOR_INTERVAL[ interval ], interval } as ReportParams;
}

/** The bucket the widget asked its data hook for on the latest render. */
function requestedBucket(): string {
	const calls = mockUseTrafficChart.mock.calls;
	return calls[ calls.length - 1 ][ 1 ];
}

/** The click handler the widget handed the chart on the latest render. */
function chartClickHandler(): ( date: Date ) => void {
	const calls = mockMetricTabsChart.mock.calls;
	return calls[ calls.length - 1 ][ 0 ].onDatumClick;
}

beforeEach( () => {
	mockDrillDown.mockClear();
	mockUseTrafficChart.mockReset();
	mockUseTrafficChart.mockReturnValue( {
		metrics: [
			{
				key: 'views',
				label: 'Views',
				value: 10,
				current: [ { date: new Date( '2026-05-01' ), value: 10 } ],
			},
		],
		isLoading: false,
		isFetching: false,
		isError: false,
		refetch: jest.fn(),
	} );
} );

describe( 'TrafficChart bucket size', () => {
	it.each( [ 'hour', 'day', 'week', 'month' ] )( 'follows the page interval: %s', interval => {
		render( <TrafficChartRender attributes={ { reportParams: reportParams( interval ) } } /> );

		expect( requestedBucket() ).toBe( interval );
	} );

	// `year` is the only interval the dashboard still offers that this chart has
	// no bucket for, so it is what reaches the clamp to the coarsest offered.
	it( 'resolves a page interval this chart cannot draw to one it can', () => {
		render( <TrafficChartRender attributes={ { reportParams: reportParams( 'year' ) } } /> );

		expect( requestedBucket() ).toBe( 'month' );
	} );

	// The Group by attribute this widget used to declare (WOOA7S-1987): a saved
	// layout can still carry it, and it must not override the page.
	it( 'ignores a granularity persisted before the widget dropped the control', () => {
		const staleAttributes = {
			reportParams: reportParams( 'month' ),
			granularity: 'day',
			granularityPickedFor: 'month',
		};

		render( <TrafficChartRender attributes={ staleAttributes } /> );

		expect( requestedBucket() ).toBe( 'month' );
	} );

	// The widget resolves this from `reportParams` alone, so it cannot need a
	// host setter — and cannot dirty the saved layout just by rendering.
	it( 'writes nothing, whatever it is handed', () => {
		const setAttributes = jest.fn();

		render(
			<TrafficChartRender
				attributes={ { reportParams: reportParams( 'month' ) } }
				setAttributes={ setAttributes }
			/>
		);

		expect( setAttributes ).not.toHaveBeenCalled();
	} );
} );

describe( 'TrafficChart drill-down', () => {
	// A yearly page draws in months here, so the click must name the month:
	// left to the page interval, a click on March would open the whole year.
	it( 'names the bucket size it drew, not the page interval', () => {
		render( <TrafficChartRender attributes={ { reportParams: reportParams( 'year' ) } } /> );

		const clicked = new Date( '2026-02-14T00:00:00.000Z' );
		chartClickHandler()( clicked );

		expect( mockDrillDown ).toHaveBeenCalledWith( clicked, 'month' );
	} );
} );
