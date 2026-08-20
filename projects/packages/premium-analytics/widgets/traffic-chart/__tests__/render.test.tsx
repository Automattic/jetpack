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

// The chart itself is not this file's subject: the bucket the widget resolves is,
// and `useTrafficChart` is where it lands.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	MetricTabsChart: () => null,
} ) );

const mockUseTrafficChart = jest.mocked( useTrafficChart );

// The dashboard only lets a range carry the intervals it can draw, and
// `normalizeReportParams` coerces anything else away — so each interval needs a
// range long enough to keep it.
const RANGE_FOR_INTERVAL: Record< string, { from: string; to: string } > = {
	month: { from: '2025-01-01', to: '2026-06-30' },
	week: { from: '2026-01-01', to: '2026-06-30' },
};

function reportParams( interval: string ): ReportParams {
	return { ...RANGE_FOR_INTERVAL[ interval ], interval } as ReportParams;
}

/** The bucket the widget asked its data hook for on the latest render. */
function requestedBucket(): string {
	const calls = mockUseTrafficChart.mock.calls;
	return calls[ calls.length - 1 ][ 1 ];
}

beforeEach( () => {
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
	it( 'follows the page interval when nobody has picked a bucket', () => {
		render( <TrafficChartRender attributes={ { reportParams: reportParams( 'month' ) } } /> );

		expect( requestedBucket() ).toBe( 'month' );
	} );

	it( "draws a reader's pick while the page still resolves to what it was picked against", () => {
		render(
			<TrafficChartRender
				attributes={ {
					reportParams: reportParams( 'month' ),
					granularity: 'day',
					granularityPickedFor: 'month',
				} }
			/>
		);

		expect( requestedBucket() ).toBe( 'day' );
	} );

	// Otherwise a reader who looked at one widget by days would keep seeing days
	// after moving the whole page to another range.
	it( 'lets the pick lapse once the page interval moves', () => {
		render(
			<TrafficChartRender
				attributes={ {
					reportParams: reportParams( 'week' ),
					granularity: 'day',
					granularityPickedFor: 'month',
				} }
			/>
		);

		expect( requestedBucket() ).toBe( 'week' );
	} );

	// A pick from before this widget offered hourly can still name `auto`.
	it( 'ignores a pick naming a bucket it no longer offers', () => {
		render(
			<TrafficChartRender
				attributes={ {
					reportParams: reportParams( 'month' ),
					granularity: 'auto' as 'day',
					granularityPickedFor: 'month' as 'day',
				} }
			/>
		);

		expect( requestedBucket() ).toBe( 'month' );
	} );

	// The widget resolves this from its attributes alone, so it cannot need a
	// host setter — and cannot dirty the saved layout just by rendering.
	it( 'writes nothing, whatever it is handed', () => {
		const setAttributes = jest.fn();

		render(
			<TrafficChartRender
				attributes={ { reportParams: reportParams( 'month' ), granularity: 'day' } }
				setAttributes={ setAttributes }
			/>
		);

		expect( setAttributes ).not.toHaveBeenCalled();
	} );
} );
