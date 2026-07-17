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
