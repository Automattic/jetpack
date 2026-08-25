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
	hour: { from: '2026-06-29', to: '2026-06-30' },
	day: { from: '2026-06-01', to: '2026-06-30' },
	week: { from: '2026-01-01', to: '2026-06-30' },
	month: { from: '2025-01-01', to: '2026-06-30' },
	quarter: { from: '2023-01-01', to: '2026-06-30' },
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
	it.each( [ 'hour', 'day', 'week', 'month' ] )( 'follows the page interval: %s', interval => {
		render( <TrafficChartRender attributes={ { reportParams: reportParams( interval ) } } /> );

		expect( requestedBucket() ).toBe( interval );
	} );

	it( 'clamps a page interval this chart cannot draw to the coarsest it can', () => {
		render( <TrafficChartRender attributes={ { reportParams: reportParams( 'quarter' ) } } /> );

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
