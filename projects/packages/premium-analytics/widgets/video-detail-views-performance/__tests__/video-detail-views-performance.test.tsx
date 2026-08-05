/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import VideoDetailViewsPerformanceWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// The chart itself is visx SVG rendering, outside this widget's concern. Keep
// the series observable so the tests can assert what the widget charts.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	ComparativeLineChart: ( {
		series,
	}: {
		series: { label: string; data: { date: Date; value: number }[] }[];
	} ) => (
		<div
			data-testid="comparative-line-chart"
			data-series-count={ series.length }
			data-series-label={ series[ 0 ]?.label }
			data-values={ series[ 0 ]?.data.map( point => point.value ).join( ',' ) }
			data-first-date={ series[ 0 ]?.data[ 0 ]?.date.toISOString() }
		/>
	),
} ) );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

/**
 * Builds a raw `statType=all` response (wpcom #229903): per-day tuples named
 * by `fields`, with the other metric columns derived from the plays the test
 * cares about, plus the embed-page/post/total fixtures.
 *
 * @param data - The daily `[date, plays]` pairs.
 * @return The raw single-video response.
 */
function buildSingleVideoResponse( data: Array< [ string, number ] > ) {
	return {
		fields: [ 'period', 'plays', 'impressions', 'watch_time', 'retention_rate' ],
		data: data.map( ( [ period, plays ] ) => [ period, plays, plays * 2, plays * 0.05, 50 ] ),
		pages: [],
		post: { ID: 105, post_title: 'Selected video', post_mime_type: 'video/mp4' },
		total: {
			plays: data.reduce( ( sum, [ , plays ] ) => sum + plays, 0 ),
			impressions: data.reduce( ( sum, [ , plays ] ) => sum + plays * 2, 0 ),
			watch_time: data.reduce( ( sum, [ , plays ] ) => sum + plays * 0.05, 0 ),
			retention_rate: 50,
		},
	};
}

/**
 * Routes a mocked request to the response for its `start_date` window.
 *
 * @param responsesByStartDate - Responses keyed by the request's `start_date`.
 * @return The apiFetch mock implementation.
 */
function respondByWindow( responsesByStartDate: Record< string, unknown > ) {
	return ( { path }: { path: string } ) => {
		const startDate = new URLSearchParams( path.split( '?' )[ 1 ] ).get( 'start_date' ) ?? '';

		return Promise.resolve( responsesByStartDate[ startDate ] ?? buildSingleVideoResponse( [] ) );
	};
}

// Strip the default `preset`: report-param consumers recompute the range from
// it, which would override the fixed window these assertions depend on.
const DEFAULT_PARAMS = { ...getDefaultQueryParams( false ), preset: undefined };

const WINDOW_PARAMS = {
	...DEFAULT_PARAMS,
	from: '2026-07-01T00:00:00.000+08:00',
	to: '2026-07-07T23:59:59.999+08:00',
	post_id: 105,
};

const PRIMARY_WINDOW_RESPONSE = buildSingleVideoResponse( [
	[ '2026-07-02', 5 ],
	[ '2026-07-04', 7 ],
] );

describe( 'VideoDetailViewsPerformanceWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it( 'charts the window as a single zero-filled Views series', async () => {
		mockApiFetch.mockImplementation( respondByWindow( { '2026-07-01': PRIMARY_WINDOW_RESPONSE } ) );

		render( <VideoDetailViewsPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		const chart = await screen.findByTestId( 'comparative-line-chart' );
		expect( chart ).toHaveAttribute( 'data-series-count', '1' );
		expect( chart ).toHaveAttribute( 'data-series-label', 'Views' );
		// One point per calendar day of the 7-day window, zero-filled around the
		// two returned days.
		expect( chart ).toHaveAttribute( 'data-values', '0,5,0,7,0,0,0' );

		// Filtered to the widget's own requests: the first rendering test in the
		// file also triggers core-data's one-off site-settings resolution.
		const requestedPaths = mockApiFetch.mock.calls
			.map( call => call[ 0 ].path as string )
			.filter( path => path.includes( 'stats/video/105' ) );
		expect( requestedPaths ).toHaveLength( 1 );
		expect( requestedPaths[ 0 ] ).toContain( 'statType=all' );
		expect( requestedPaths[ 0 ] ).toContain( 'period=day' );
		expect( requestedPaths[ 0 ] ).toContain( 'start_date=2026-07-01' );
		expect( requestedPaths[ 0 ] ).toContain( 'date=2026-07-07' );
	} );

	it( 'anchors bucket days at site-local midnight so negative-offset sites keep the calendar day', async () => {
		// A UTC-12 site: a date-only bucket key parsed as UTC midnight would
		// render as the previous day once formatted in the site timezone. The
		// point instant must be the key's site-local midnight instead.
		const defaultSettings = getSettings();
		setSettings( {
			...defaultSettings,
			timezone: { offset: -12, offsetFormatted: '-12', string: '', abbr: '' },
		} );

		try {
			mockApiFetch.mockImplementation(
				respondByWindow( { '2026-07-01': PRIMARY_WINDOW_RESPONSE } )
			);

			render(
				<VideoDetailViewsPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } />
			);

			const chart = await screen.findByTestId( 'comparative-line-chart' );
			// 2026-07-01 site-local midnight at UTC-12 is 2026-07-01T12:00:00Z.
			expect( chart ).toHaveAttribute( 'data-first-date', '2026-07-01T12:00:00.000Z' );
		} finally {
			setSettings( defaultSettings );
		}
	} );

	it( 'buckets views into ISO weeks for the week granularity', async () => {
		mockApiFetch.mockImplementation( respondByWindow( { '2026-07-01': PRIMARY_WINDOW_RESPONSE } ) );

		render(
			<VideoDetailViewsPerformanceWidget
				attributes={ { reportParams: WINDOW_PARAMS, granularity: 'week' } }
			/>
		);

		// 2026-07-01 (Wed) → 2026-07-07 spans two ISO weeks: Mon 6/29 (5 + 7
		// views) and Mon 7/6 (zero).
		const chart = await screen.findByTestId( 'comparative-line-chart' );
		expect( chart ).toHaveAttribute( 'data-values', '12,0' );
	} );

	it( 'ignores comparison report params: one request, single series', async () => {
		mockApiFetch.mockImplementation( respondByWindow( { '2026-07-01': PRIMARY_WINDOW_RESPONSE } ) );

		render(
			<VideoDetailViewsPerformanceWidget
				attributes={ {
					reportParams: {
						...WINDOW_PARAMS,
						// Comparison params pass through the video detail URL untouched
						// (dashboard state survives the round trip), so a widget
						// receiving them must neither fetch a second window nor draw
						// an overlay — the page renders no comparison.
						comp: '1',
						compare_from: '2026-06-24T00:00:00.000+08:00',
						compare_to: '2026-06-30T23:59:59.999+08:00',
					},
				} }
			/>
		);

		const chart = await screen.findByTestId( 'comparative-line-chart' );
		expect( chart ).toHaveAttribute( 'data-series-count', '1' );
		expect( chart ).toHaveAttribute( 'data-series-label', 'Views' );
		expect( chart ).toHaveAttribute( 'data-values', '0,5,0,7,0,0,0' );

		const requestedPaths = mockApiFetch.mock.calls
			.map( call => call[ 0 ].path as string )
			.filter( path => path.includes( 'stats/video/105' ) );
		expect( requestedPaths ).toHaveLength( 1 );
		expect( requestedPaths[ 0 ] ).toContain( 'start_date=2026-07-01' );
		expect( requestedPaths.some( path => path.includes( 'start_date=2026-06-24' ) ) ).toBe( false );
	} );

	it( 'renders the scopeless empty state and makes no request without a video scope', async () => {
		render( <VideoDetailViewsPerformanceWidget attributes={ {} } /> );

		await expect(
			screen.findByText( 'Open a video report to see its views here.' )
		).resolves.toBeInTheDocument();
		expect(
			mockApiFetch.mock.calls.filter( call =>
				( call[ 0 ].path as string ).includes( 'stats/video' )
			)
		).toHaveLength( 0 );
	} );

	it( 'shows the error state with a Retry action when the fetch fails', async () => {
		// A 403 skips React Query's retry backoff so the error surfaces
		// immediately; the `no_connection` code keeps `describeError` on the
		// retryable branch (a broken Jetpack connection can heal).
		mockApiFetch.mockRejectedValue( { status: 403, code: 'no_connection', message: 'Forbidden' } );

		render( <VideoDetailViewsPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		await expect(
			screen.findByText( /couldn't load this video's views/ )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
	} );

	it( 'shows the permission error without a Retry action on a plain 403', async () => {
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );

		render( <VideoDetailViewsPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		await expect(
			screen.findByText( "You don't have access to this data." )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );
} );
