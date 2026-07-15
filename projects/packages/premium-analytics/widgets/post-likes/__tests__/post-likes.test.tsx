/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import PostLikesWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

function renderWidget( postId: number ) {
	return render(
		<PostLikesWidget
			attributes={ {
				reportParams: { ...getDefaultQueryParams( false ), post_id: postId },
			} }
		/>
	);
}

describe( 'PostLikesWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it( 'treats a non-integer post ID as missing scope without requesting data', () => {
		renderWidget( 1.5 );

		expect(
			screen.getByText( 'Open a post or page report to see its likes here.' )
		).toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'uses a neutral empty state for a post or page with no likes', async () => {
		mockApiFetch.mockResolvedValue( { found: 0, likes: [] } );

		renderWidget( 779 );

		await expect( screen.findByText( 'There are no likes yet.' ) ).resolves.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: expect.stringContaining( '/proxy/v1.2/posts/779/likes' ),
			} )
		);
	} );

	it( 'uses a neutral error state when likes cannot be loaded', async () => {
		mockApiFetch.mockRejectedValue( { status: 403 } );

		renderWidget( 779 );

		await expect(
			screen.findByText( "We couldn't load these likes. Please try again in a moment." )
		).resolves.toBeInTheDocument();
	} );
} );
