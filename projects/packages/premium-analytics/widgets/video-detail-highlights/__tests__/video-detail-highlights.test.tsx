/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import VideoDetailHighlightsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// A `statType=all` range response (wpcom #229903): per-day tuples named by
// `fields` plus canonical totals over the requested window — the tiles read
// the totals, not the series.
const ALL_METRICS_RESPONSE = {
	fields: [ 'period', 'plays', 'impressions', 'watch_time', 'retention_rate' ],
	data: [
		[ '2026-07-01', 64, 200, 6.3, 70 ],
		[ '2026-07-04', 64, 256, 12.6, 65.2 ],
	],
	pages: [],
	post: {
		ID: 105,
		post_title: 'Selected video',
		post_mime_type: 'video/mp4',
	},
	total: { plays: 128, impressions: 456, watch_time: 18.9, retention_rate: 67.6 },
};

// A 403 skips React Query's retry backoff so the error surfaces immediately;
// the `no_connection` code keeps `describeError` on the retryable branch (a
// broken Jetpack connection can heal), while a plain 403 maps to the
// permission copy without a Retry action.
const MOCK_RETRYABLE_ERROR = {
	status: 403,
	code: 'no_connection',
	message: 'Forbidden',
};

function renderWidget( postId?: number, withComparison = false ) {
	return render(
		<VideoDetailHighlightsWidget
			attributes={ {
				reportParams: {
					from: '2026-07-01',
					to: '2026-07-07',
					interval: 'day',
					...( withComparison
						? {
								comp: '1',
								compare_from: '2026-06-24',
								compare_to: '2026-06-30',
						  }
						: {} ),
					...( postId === undefined ? {} : { post_id: postId } ),
				},
			} }
		/>
	);
}

describe( 'VideoDetailHighlightsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( ALL_METRICS_RESPONSE );
	} );

	it( 'renders the range totals from one statType=all request', async () => {
		renderWidget( 105 );

		await expect( screen.findByText( '456' ) ).resolves.toBeInTheDocument();

		const tiles = screen.getAllByRole( 'listitem' );
		expect( tiles ).toHaveLength( 3 );
		expect( tiles[ 0 ] ).toHaveTextContent( 'Impressions456' );
		expect( tiles[ 1 ] ).toHaveTextContent( 'Hours watched18.9' );
		expect( tiles[ 2 ] ).toHaveTextContent( 'Retention rate67.6%' );

		// Filtered to the widget's own requests: the first rendering test in the
		// file also triggers core-data's one-off site-settings resolution.
		const allPaths = mockApiFetch.mock.calls.map( call => call[ 0 ].path as string );
		const requestedPaths = allPaths.filter( path => path.includes( 'stats/video/105' ) );
		expect( requestedPaths ).toHaveLength( 1 );
		expect( requestedPaths[ 0 ] ).toContain( 'statType=all' );
		expect( requestedPaths[ 0 ] ).toContain( 'period=day' );
		expect( requestedPaths[ 0 ] ).toContain( 'start_date=2026-07-01' );
		expect( requestedPaths[ 0 ] ).toContain( 'date=2026-07-07' );
		expect( allPaths.some( path => path.includes( 'stats/video-plays' ) ) ).toBe( false );
	} );

	it( 'does not issue extra requests for comparison report params the tiles cannot use', async () => {
		renderWidget( 105, true );

		await expect( screen.findByText( '456' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( /^[+-]\d+%$/ ) ).not.toBeInTheDocument();

		const requestedPaths = mockApiFetch.mock.calls
			.map( call => call[ 0 ].path as string )
			.filter( path => path.includes( 'stats/video/105' ) );
		expect( requestedPaths ).toHaveLength( 1 );
		expect( requestedPaths[ 0 ] ).toContain( 'date=2026-07-07' );
		expect( requestedPaths[ 0 ] ).not.toContain( 'date=2026-06-30' );
	} );

	it( 'renders placeholders, not zeros, for metrics missing from the totals', async () => {
		mockApiFetch.mockResolvedValue( {
			...ALL_METRICS_RESPONSE,
			fields: [ 'period', 'plays' ],
			data: [ [ '2026-07-01', 64 ] ],
			total: { plays: 128 },
		} );
		renderWidget( 105 );

		const tiles = await screen.findAllByRole( 'listitem' );
		expect( tiles ).toHaveLength( 3 );
		expect( tiles[ 0 ] ).toHaveTextContent( 'Impressions—' );
		expect( tiles[ 1 ] ).toHaveTextContent( 'Hours watched—' );
		expect( tiles[ 2 ] ).toHaveTextContent( 'Retention rate—' );
		expect( screen.queryByText( '0' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( '0.0' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( '0.0%' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the scope-empty state and skips fetching without a post_id', () => {
		renderWidget();

		expect( screen.getByText( /open a video report/i ) ).toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'renders an empty state when the response carries no totals', async () => {
		mockApiFetch.mockResolvedValue( { ...ALL_METRICS_RESPONSE, total: undefined } );
		renderWidget( 105 );

		await expect(
			screen.findByText( /no highlights are available/i )
		).resolves.toBeInTheDocument();
	} );

	it( 'renders an error state with a Retry action', async () => {
		mockApiFetch.mockRejectedValue( MOCK_RETRYABLE_ERROR );
		renderWidget( 105 );

		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			/couldn't load this video's highlights/i
		);

		const requestsBeforeRetry = mockApiFetch.mock.calls.length;
		mockApiFetch.mockResolvedValue( ALL_METRICS_RESPONSE );
		fireEvent.click( screen.getByRole( 'button', { name: /retry/i } ) ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.

		await expect( screen.findByText( '456' ) ).resolves.toBeInTheDocument();
		expect( mockApiFetch.mock.calls.length ).toBeGreaterThan( requestsBeforeRetry );
	} );

	it( 'shows the permission error without a Retry action on a plain 403', async () => {
		// Both video-detail cards share one cache entry, so this must match the
		// Views performance card's no-access state instead of offering a Retry
		// that can never succeed.
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );
		renderWidget( 105 );

		await expect(
			screen.findByText( "You don't have access to this data." )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /retry/i } ) ).not.toBeInTheDocument();
	} );
} );
