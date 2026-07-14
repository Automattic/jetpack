/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import VideoDetailEmbedsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const SINGLE_VIDEO_RESPONSE = {
	data: [
		[ '2026-06-21', 12 ],
		[ '2026-06-22', 34 ],
	],
	pages: [ 'https://example.com/getting-started/', 'https://example.com/blog/weekly-recap/' ],
};

// A 403 is not retried by the data layer's `shouldRetryApiError`, so the error
// state shows at once instead of after the query's retry backoff.
const MOCK_API_ERROR = {
	code: 'stats_mock_error',
	message: 'Mocked error response.',
	data: { status: 403 },
};

function renderWidget( postId?: number ) {
	return render(
		<VideoDetailEmbedsWidget
			attributes={ {
				reportParams: {
					...getDefaultQueryParams( false, 'last-7-days' ),
					...( postId === undefined ? {} : { post_id: postId } ),
				},
			} }
		/>
	);
}

describe( 'VideoDetailEmbedsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( SINGLE_VIDEO_RESPONSE );
	} );

	it( 'lists the pages where the selected video is embedded as external links', async () => {
		renderWidget( 105 );

		const link = await screen.findByRole( 'link', { name: /getting-started/i } );
		expect( link ).toHaveAttribute( 'href', 'https://example.com/getting-started/' );
		expect( screen.getByRole( 'link', { name: /weekly-recap/i } ) ).toHaveAttribute(
			'href',
			'https://example.com/blog/weekly-recap/'
		);
	} );

	it( 'prompts to select a video and skips fetching when no video is scoped', () => {
		renderWidget();

		expect( screen.getByText( /select a video/i ) ).toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'shows the empty state when the video is not embedded anywhere', async () => {
		mockApiFetch.mockResolvedValue( { ...SINGLE_VIDEO_RESPONSE, pages: [] } );

		renderWidget( 105 );

		await expect( screen.findByText( /has not been embedded/i ) ).resolves.toBeInTheDocument();
	} );

	it( 'shows the error state with a Retry action that re-runs the query', async () => {
		mockApiFetch.mockRejectedValue( MOCK_API_ERROR );

		renderWidget( 105 );

		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			/couldn't load video embeds/i
		);

		const requestsBeforeRetry = mockApiFetch.mock.calls.length;
		mockApiFetch.mockResolvedValue( SINGLE_VIDEO_RESPONSE );
		fireEvent.click( screen.getByRole( 'button', { name: /retry/i } ) ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.

		await expect(
			screen.findByRole( 'link', { name: /getting-started/i } )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch.mock.calls.length ).toBeGreaterThan( requestsBeforeRetry );
	} );
} );
