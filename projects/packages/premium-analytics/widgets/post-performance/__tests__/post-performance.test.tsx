/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import PostPerformanceWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// The tabs-over-chart component is toolkit-owned SVG rendering, outside this
// widget's concern. Keep the metric tabs observable so the tests can assert
// what the widget feeds it.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	MetricTabsChart: ( {
		metrics,
	}: {
		metrics: { key: string; value: number; current: { value: number }[] }[];
	} ) => (
		<div
			data-testid="metric-tabs-chart"
			data-metrics={ metrics.map( metric => `${ metric.key }:${ metric.value }` ).join( ',' ) }
			data-views-points={ metrics[ 0 ]?.current.map( point => point.value ).join( ',' ) }
		/>
	),
} ) );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// Raw `stats/post/{id}` shape: the daily history as [date, views] pairs plus
// the lifetime like/comment totals the value-only tabs read.
const STATS_POST_RESPONSE = {
	data: [
		[ '2026-07-02', 5 ],
		[ '2026-07-04', 7 ],
	],
	like_count: 3,
	post: { comment_count: 2 },
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

describe( 'PostPerformanceWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it( 'zero-fills the window and sums views into the tabs alongside lifetime totals', async () => {
		mockApiFetch.mockResolvedValue( STATS_POST_RESPONSE );

		render( <PostPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		// Views totals the in-window days; comments/likes are the lifetime counts.
		expect( chart ).toHaveAttribute( 'data-metrics', 'views:12,comments:2,likes:3' );
		// One point per calendar day of the 7-day window, zero-filled around the
		// two days the endpoint reported.
		expect( chart ).toHaveAttribute( 'data-views-points', '0,5,0,7,0,0,0' );

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'stats/post/779' );
	} );

	it( 'buckets views into ISO weeks for the week granularity', async () => {
		mockApiFetch.mockResolvedValue( STATS_POST_RESPONSE );

		render(
			<PostPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS, granularity: 'week' } } />
		);

		// 2026-07-01 (Wed) → 2026-07-07 spans two ISO weeks: Mon 6/29 (5 + 7
		// views) and Mon 7/6 (zero).
		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		expect( chart ).toHaveAttribute( 'data-views-points', '12,0' );
	} );

	it( 'renders the scopeless empty state and makes no request without a post scope', async () => {
		render( <PostPerformanceWidget attributes={ {} } /> );

		await expect(
			screen.findByText( 'Open a post or page report to see its performance here.' )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'shows the error state with a Retry action when the fetch fails', async () => {
		// A non-retryable 403 so React Query surfaces the error immediately
		// instead of after the retry backoff.
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );

		render( <PostPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		await expect(
			screen.findByText( /couldn't load this post's performance/ )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
	} );
} );
