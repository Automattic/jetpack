/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import PostViewsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// The chart itself is visx SVG rendering, outside this widget's concern. Keep
// the series observable so the tests can assert what the widget charts.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	ComparativeLineChart: ( {
		series,
	}: {
		series: { label: string; data: { value: number }[] }[];
	} ) => (
		<div
			data-testid="comparative-line-chart"
			data-series-count={ series.length }
			data-series-label={ series[ 0 ]?.label }
			data-values={ series[ 0 ]?.data.map( point => point.value ).join( ',' ) }
			data-previous-values={ series[ 1 ]?.data.map( point => point.value ).join( ',' ) }
		/>
	),
} ) );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// Raw `stats/post/{id}` shape: the daily view history as [date, views] pairs.
const STATS_POST_RESPONSE = {
	data: [
		[ '2026-06-25', 9 ],
		[ '2026-07-02', 5 ],
		[ '2026-07-04', 7 ],
	],
};

// Strip the default `preset`: report-param consumers recompute the range from
// it, which would override the fixed window these assertions depend on.
const DEFAULT_PARAMS = { ...getDefaultQueryParams( false ), preset: undefined };

const WINDOW_PARAMS = {
	...DEFAULT_PARAMS,
	from: '2026-07-01T00:00:00.000+08:00',
	to: '2026-07-07T23:59:59.999+08:00',
	post_id: 779,
};

describe( 'PostViewsWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it( 'charts the window as a single zero-filled Views series', async () => {
		mockApiFetch.mockResolvedValue( STATS_POST_RESPONSE );

		render( <PostViewsWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		const chart = await screen.findByTestId( 'comparative-line-chart' );
		expect( chart ).toHaveAttribute( 'data-series-count', '1' );
		expect( chart ).toHaveAttribute( 'data-series-label', 'Views' );
		// One point per calendar day of the 7-day window, zero-filled around the
		// two in-window days; the 6/25 day falls outside the window.
		expect( chart ).toHaveAttribute( 'data-values', '0,5,0,7,0,0,0' );

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'stats/post/779' );
	} );

	it( 'buckets views into ISO weeks for the week granularity', async () => {
		mockApiFetch.mockResolvedValue( STATS_POST_RESPONSE );

		render(
			<PostViewsWidget attributes={ { reportParams: WINDOW_PARAMS, granularity: 'week' } } />
		);

		// 2026-07-01 (Wed) → 2026-07-07 spans two ISO weeks: Mon 6/29 (5 + 7
		// views) and Mon 7/6 (zero).
		const chart = await screen.findByTestId( 'comparative-line-chart' );
		expect( chart ).toHaveAttribute( 'data-values', '12,0' );
	} );

	it( 'slices the comparison overlay from the same request', async () => {
		mockApiFetch.mockResolvedValue( STATS_POST_RESPONSE );

		render(
			<PostViewsWidget
				attributes={ {
					reportParams: {
						...WINDOW_PARAMS,
						// `comp: '1'` switches the comparison on; without it the
						// param normalizer drops the compare window.
						comp: '1',
						compare_from: '2026-06-24T00:00:00.000+08:00',
						compare_to: '2026-06-30T23:59:59.999+08:00',
					},
				} }
			/>
		);

		const chart = await screen.findByTestId( 'comparative-line-chart' );
		expect( chart ).toHaveAttribute( 'data-series-count', '2' );
		// The comparison window catches the 6/25 day; both windows zero-fill to
		// the same bucket count so the index-aligned overlay can't scrunch.
		expect( chart ).toHaveAttribute( 'data-previous-values', '0,9,0,0,0,0,0' );
		// One request serves both windows.
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'uses primary month buckets for a previous period that crosses a month boundary', async () => {
		mockApiFetch.mockResolvedValue( {
			data: [
				[ '2026-01-29', 1 ],
				[ '2026-02-01', 2 ],
				[ '2026-02-28', 3 ],
				[ '2026-03-01', 4 ],
				[ '2026-03-31', 5 ],
			],
		} );

		render(
			<PostViewsWidget
				attributes={ {
					reportParams: {
						...DEFAULT_PARAMS,
						from: '2026-03-01T00:00:00.000+08:00',
						to: '2026-03-31T23:59:59.999+08:00',
						post_id: 779,
						comp: '1',
						compare_from: '2026-01-29T00:00:00.000+08:00',
						compare_to: '2026-02-28T23:59:59.999+08:00',
					},
					granularity: 'month',
				} }
			/>
		);

		const chart = await screen.findByTestId( 'comparative-line-chart' );
		expect( chart ).toHaveAttribute( 'data-values', '9' );
		// The previous period is one relative monthly bucket, not separate January
		// and February points that the comparative chart would collapse onto March.
		expect( chart ).toHaveAttribute( 'data-previous-values', '6' );
	} );

	it( 'clamps a shorter previous-month compare bucket to its own window', async () => {
		// Primary March (31 days) vs previous-month February (28 days), monthly.
		// The compare bucket must sum only February — a naive relative offset
		// would run three days past the compare window and pull March 2 in.
		mockApiFetch.mockResolvedValue( {
			data: [
				[ '2026-02-10', 5 ],
				[ '2026-02-20', 7 ],
				[ '2026-03-02', 50 ],
				[ '2026-03-10', 100 ],
				[ '2026-03-20', 200 ],
			],
		} );

		render(
			<PostViewsWidget
				attributes={ {
					reportParams: {
						...DEFAULT_PARAMS,
						from: '2026-03-01T00:00:00.000+08:00',
						to: '2026-03-31T23:59:59.999+08:00',
						post_id: 779,
						comp: '1',
						compare_from: '2026-02-01T00:00:00.000+08:00',
						compare_to: '2026-02-28T23:59:59.999+08:00',
					},
					granularity: 'month',
				} }
			/>
		);

		const chart = await screen.findByTestId( 'comparative-line-chart' );
		expect( chart ).toHaveAttribute( 'data-values', '350' );
		// Only February's 5 + 7; March 2's 50 stays out of the compare bucket.
		expect( chart ).toHaveAttribute( 'data-previous-values', '12' );
	} );

	it( 'keeps a longer previous-month compare window from truncating', async () => {
		// Primary February (28 days) vs previous-month January (31 days),
		// monthly. The compare bucket must sum all of January — the last bucket
		// has to extend to the compare window end rather than stopping at the
		// primary length.
		mockApiFetch.mockResolvedValue( {
			data: [
				[ '2026-01-15', 10 ],
				[ '2026-01-30', 20 ],
				[ '2026-02-15', 100 ],
			],
		} );

		render(
			<PostViewsWidget
				attributes={ {
					reportParams: {
						...DEFAULT_PARAMS,
						from: '2026-02-01T00:00:00.000+08:00',
						to: '2026-02-28T23:59:59.999+08:00',
						post_id: 779,
						comp: '1',
						compare_from: '2026-01-01T00:00:00.000+08:00',
						compare_to: '2026-01-31T23:59:59.999+08:00',
					},
					granularity: 'month',
				} }
			/>
		);

		const chart = await screen.findByTestId( 'comparative-line-chart' );
		expect( chart ).toHaveAttribute( 'data-values', '100' );
		// Both January days, including Jan 30 which the old offset would drop.
		expect( chart ).toHaveAttribute( 'data-previous-values', '30' );
	} );

	it( 'renders the scopeless empty state and makes no request without a post scope', async () => {
		render( <PostViewsWidget attributes={ {} } /> );

		await expect(
			screen.findByText( 'Open a post or page report to see its views here.' )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'shows the error state with a Retry action when the fetch fails', async () => {
		// A non-retryable 403 so React Query surfaces the error immediately
		// instead of after the retry backoff.
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );

		render( <PostViewsWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		await expect(
			screen.findByText( /couldn't load this post's views/ )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
	} );
} );
