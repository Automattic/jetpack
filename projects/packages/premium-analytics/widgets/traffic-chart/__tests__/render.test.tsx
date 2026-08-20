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

	// A fresh visit is the page's to decide: a bucket saved under one interval must
	// not come back under whatever interval the next visit arrives on.
	it( 'lets the page take the bucket back on a fresh mount, over a stored one', () => {
		const setAttributes = jest.fn();

		render(
			<TrafficChartRender
				attributes={ { reportParams: reportParams( 'month' ), granularity: 'day' } }
				setAttributes={ setAttributes }
			/>
		);

		expect( requestedBucket() ).toBe( 'month' );
		expect( setAttributes ).toHaveBeenCalledWith( { granularity: undefined } );
	} );

	// The write is what dirties the saved dashboard layout, so a widget nobody has
	// touched must not make one just by loading.
	it( 'writes nothing when it has no stored bucket to hand back', () => {
		const setAttributes = jest.fn();

		render(
			<TrafficChartRender
				attributes={ { reportParams: reportParams( 'month' ) } }
				setAttributes={ setAttributes }
			/>
		);

		expect( requestedBucket() ).toBe( 'month' );
		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'draws a bucket picked after mount over the page interval', () => {
		const { rerender } = render(
			<TrafficChartRender attributes={ { reportParams: reportParams( 'month' ) } } />
		);

		rerender(
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

	// Otherwise a reader who looked at one widget by days would keep seeing days
	// after moving the whole page to another range.
	it( 'hands the page interval back to the host when the page moves', () => {
		const setAttributes = jest.fn();
		const { rerender } = render(
			<TrafficChartRender
				attributes={ { reportParams: reportParams( 'month' ) } }
				setAttributes={ setAttributes }
			/>
		);

		// The reader's own pick, made after the page seeded the bucket.
		rerender(
			<TrafficChartRender
				attributes={ { reportParams: reportParams( 'month' ), granularity: 'day' } }
				setAttributes={ setAttributes }
			/>
		);
		setAttributes.mockClear();

		rerender(
			<TrafficChartRender
				attributes={ { reportParams: reportParams( 'week' ), granularity: 'day' } }
				setAttributes={ setAttributes }
			/>
		);

		expect( setAttributes ).toHaveBeenCalledWith( { granularity: undefined } );
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
		setAttributes.mockClear();

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
