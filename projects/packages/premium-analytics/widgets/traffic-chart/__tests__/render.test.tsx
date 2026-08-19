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
	it( 'follows the page interval when the widget has no bucket of its own', () => {
		render( <TrafficChartRender attributes={ { reportParams: reportParams( 'month' ) } } /> );

		expect( requestedBucket() ).toBe( 'month' );
	} );

	it( 'draws the stored bucket over the page interval', () => {
		render(
			<TrafficChartRender
				attributes={ { reportParams: reportParams( 'month' ), granularity: 'day' } }
			/>
		);

		expect( requestedBucket() ).toBe( 'day' );
	} );

	// A layout saved before this widget offered hourly still carries `auto`, which
	// is no longer a bucket and must not reach the request.
	it( 'ignores a legacy `auto` and falls back to the page interval', () => {
		render(
			<TrafficChartRender
				attributes={ {
					reportParams: reportParams( 'month' ),
					granularity: 'auto' as 'day',
				} }
			/>
		);

		expect( requestedBucket() ).toBe( 'month' );
	} );

	// Without an `Auto` option the host's select falls back to the first bucket
	// offered, so leaving the attribute unset would show `By hours` over a chart
	// drawing months. The widget seeds it instead.
	it( 'seeds the stored bucket from the page when it has none', () => {
		const setAttributes = jest.fn();

		render(
			<TrafficChartRender
				attributes={ { reportParams: reportParams( 'month' ) } }
				setAttributes={ setAttributes }
			/>
		);

		expect( setAttributes ).toHaveBeenCalledWith( { granularity: 'month' } );
	} );

	it( 'seeds over a legacy `auto` too, so the control stops showing one', () => {
		const setAttributes = jest.fn();

		render(
			<TrafficChartRender
				attributes={ { reportParams: reportParams( 'week' ), granularity: 'auto' as 'day' } }
				setAttributes={ setAttributes }
			/>
		);

		expect( setAttributes ).toHaveBeenCalledWith( { granularity: 'week' } );
	} );

	// Otherwise a reader who looked at one widget by days would keep seeing days
	// after moving the whole page to another range.
	it( 'hands the page interval back to the host when the page moves', () => {
		const setAttributes = jest.fn();
		const { rerender } = render(
			<TrafficChartRender
				attributes={ { reportParams: reportParams( 'month' ), granularity: 'day' } }
				setAttributes={ setAttributes }
			/>
		);

		expect( setAttributes ).not.toHaveBeenCalled();

		rerender(
			<TrafficChartRender
				attributes={ { reportParams: reportParams( 'week' ), granularity: 'day' } }
				setAttributes={ setAttributes }
			/>
		);

		expect( setAttributes ).toHaveBeenCalledWith( { granularity: 'week' } );
		// Drawn on the same render the page moved, rather than a render later:
		// otherwise the outgoing bucket's requests go out and are thrown away.
		expect( requestedBucket() ).toBe( 'week' );
	} );

	// The realign is keyed to the page's bucket moving, so an unrelated change to
	// the report params must leave the reader's choice alone.
	it( 'keeps the stored bucket while the page interval holds still', () => {
		const setAttributes = jest.fn();
		const { rerender } = render(
			<TrafficChartRender
				attributes={ { reportParams: reportParams( 'month' ), granularity: 'day' } }
				setAttributes={ setAttributes }
			/>
		);

		rerender(
			<TrafficChartRender
				attributes={ {
					reportParams: { ...reportParams( 'month' ), to: '2026-07-31' } as ReportParams,
					granularity: 'day',
				} }
				setAttributes={ setAttributes }
			/>
		);

		expect( setAttributes ).not.toHaveBeenCalled();
		expect( requestedBucket() ).toBe( 'day' );
	} );
} );
