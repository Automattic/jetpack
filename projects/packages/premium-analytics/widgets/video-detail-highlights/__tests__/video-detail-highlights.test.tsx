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

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const COMPLETE_STATS_RESPONSE = {
	date: '2026-07-14',
	period: 'day',
	days: {
		summary: {
			data: [
				{
					post_id: 104,
					title: 'Another video',
					views: '999',
					impressions: '888',
					watch_time: '77.7',
					retention_rate: '55.5',
				},
				{
					post_id: 105,
					title: 'Selected video',
					views: '128',
					impressions: '456',
					watch_time: '18.9',
					retention_rate: '67.6',
				},
			],
			total: {
				views: '1127',
				impressions: '1344',
				watch_time: '96.6',
			},
		},
	},
};

const COMPARISON_STATS_RESPONSE = {
	date: '2026-06-30',
	period: 'day',
	days: {
		summary: {
			data: [
				{
					post_id: 105,
					title: 'Selected video',
					views: '64',
					impressions: '228',
					watch_time: '12.6',
					retention_rate: '52',
				},
			],
		},
	},
};

const COMPARISON_WITHOUT_SELECTED_VIDEO_RESPONSE = {
	date: '2026-06-30',
	period: 'day',
	days: {
		summary: {
			data: [
				{
					post_id: 104,
					title: 'Another video',
					views: '500',
					impressions: '600',
					watch_time: '40',
					retention_rate: '50',
				},
			],
		},
	},
};

const MOCK_API_ERROR = {
	code: 'stats_mock_error',
	message: 'Mocked error response.',
	data: { status: 403 },
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
		mockApiFetch.mockResolvedValue( COMPLETE_STATS_RESPONSE );
	} );

	it( 'renders plain tiles when comparison is off', async () => {
		renderWidget( 105 );

		await expect( screen.findByText( '128' ) ).resolves.toBeInTheDocument();

		const tiles = screen.getAllByRole( 'listitem' );
		expect( tiles ).toHaveLength( 4 );
		expect( tiles[ 0 ] ).toHaveTextContent( 'Views128' );
		expect( tiles[ 1 ] ).toHaveTextContent( 'Impressions456' );
		expect( tiles[ 2 ] ).toHaveTextContent( 'Hours watched18.9' );
		expect( tiles[ 3 ] ).toHaveTextContent( 'Retention rate67.6%' );
		expect( screen.queryByText( /^[+-]\d+%$/ ) ).not.toBeInTheDocument();

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		const videoRequests = mockApiFetch.mock.calls.filter( call =>
			( call[ 0 ].path as string ).includes( 'stats/video-plays' )
		);
		expect( videoRequests ).toHaveLength( 1 );
		expect( requestedPath ).toContain( 'stats/video-plays' );
		expect( requestedPath ).toContain( 'complete_stats=1' );
		expect( requestedPath ).toContain( 'max=0' );
		expect( requestedPath ).toContain( 'period=day' );
		expect( requestedPath ).toContain( 'start_date=' );
		expect( requestedPath ).toContain( 'date=' );
		expect( requestedPath ).not.toContain( 'summarize=' );
	} );

	it( 'renders per-tile deltas from the selected video comparison row', async () => {
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve(
				path.includes( 'date=2026-06-30' ) ? COMPARISON_STATS_RESPONSE : COMPLETE_STATS_RESPONSE
			)
		);

		renderWidget( 105, true );

		await expect( screen.findAllByText( '+100%' ) ).resolves.toHaveLength( 2 );
		expect( screen.getByText( '+50%' ) ).toBeInTheDocument();
		expect( screen.getByText( '+30%' ) ).toBeInTheDocument();

		const requestedPaths = mockApiFetch.mock.calls.map( call => call[ 0 ].path as string );
		expect( requestedPaths.some( path => path.includes( 'date=2026-07-07' ) ) ).toBe( true );
		expect( requestedPaths.some( path => path.includes( 'date=2026-06-30' ) ) ).toBe( true );
	} );

	it( 'uses the comparison layout without a delta when the selected video row is absent', async () => {
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve(
				path.includes( 'date=2026-06-30' )
					? COMPARISON_WITHOUT_SELECTED_VIDEO_RESPONSE
					: COMPLETE_STATS_RESPONSE
			)
		);

		renderWidget( 105, true );

		await expect( screen.findByText( '128' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( /^[+-]\d+%$/ ) ).not.toBeInTheDocument();
		const videoRequests = mockApiFetch.mock.calls.filter( call =>
			( call[ 0 ].path as string ).includes( 'stats/video-plays' )
		);
		expect( videoRequests ).toHaveLength( 2 );
	} );

	it( 'renders the scope-empty state and skips fetching without a post_id', () => {
		renderWidget();

		expect( screen.getByText( /open a video report/i ) ).toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'renders an error state with a Retry action', async () => {
		mockApiFetch.mockRejectedValue( MOCK_API_ERROR );
		renderWidget( 105 );

		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			/couldn't load this video's highlights/i
		);

		const requestsBeforeRetry = mockApiFetch.mock.calls.length;
		mockApiFetch.mockResolvedValue( COMPLETE_STATS_RESPONSE );
		fireEvent.click( screen.getByRole( 'button', { name: /retry/i } ) ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.

		await expect( screen.findByText( '128' ) ).resolves.toBeInTheDocument();
		expect( mockApiFetch.mock.calls.length ).toBeGreaterThan( requestsBeforeRetry );
	} );
} );
