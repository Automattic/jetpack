/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { act, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import PostCommentsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

function renderWidget( postId: number ) {
	return render(
		<PostCommentsWidget
			attributes={ {
				reportParams: { ...getDefaultQueryParams( false ), post_id: postId },
			} }
		/>
	);
}

describe( 'PostCommentsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it( 'treats a non-integer post ID as missing scope without requesting data', () => {
		renderWidget( 1.5 );

		expect(
			screen.getByText( 'Open a post or page report to see its comments here.' )
		).toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'uses a neutral empty state for a post or page with no comments', async () => {
		mockApiFetch.mockResolvedValue( { found: 0, comments: [] } );

		renderWidget( 779 );

		await expect( screen.findByText( 'There are no comments yet.' ) ).resolves.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: expect.stringContaining( '/proxy/v1.1/posts/779/replies' ),
			} )
		);
	} );

	it( 'renders commenters, comment links, and the remaining count', async () => {
		mockApiFetch.mockResolvedValue( {
			found: 24,
			comments: [
				{
					ID: 101,
					author: { name: 'Olivia Park', avatar_URL: 'https://gravatar.com/avatar/1' },
					URL: 'https://example.com/post/#comment-101',
					date: new Date().toISOString(),
				},
			],
		} );

		renderWidget( 779 );

		const author = await screen.findByRole( 'link', { name: /Olivia Park/ } );
		expect( author ).toHaveAttribute( 'href', 'https://example.com/post/#comment-101' );
		expect( screen.getByText( '23 more' ) ).toBeInTheDocument();
	} );

	it( 'uses a neutral error state when comments cannot be loaded', async () => {
		mockApiFetch.mockRejectedValue( { status: 403 } );

		renderWidget( 779 );

		await expect(
			screen.findByText( "We couldn't load these comments. Please try again in a moment." )
		).resolves.toBeInTheDocument();
	} );

	it( 'keeps existing comments visible when a background refetch fails', async () => {
		mockApiFetch
			.mockResolvedValueOnce( {
				found: 1,
				comments: [
					{
						ID: 101,
						author: { name: 'Olivia Park' },
						URL: 'https://example.com/post/#comment-101',
						date: new Date().toISOString(),
					},
				],
			} )
			.mockRejectedValueOnce( { status: 403 } );

		renderWidget( 779 );

		await expect(
			screen.findByRole( 'link', { name: /Olivia Park/ } )
		).resolves.toBeInTheDocument();

		await act( async () => {
			await queryClient.invalidateQueries( { queryKey: [ 'stats', 'post-comments' ] } );
		} );

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalledTimes( 2 ) );
		expect( screen.getByRole( 'link', { name: /Olivia Park/ } ) ).toBeInTheDocument();
		expect(
			screen.queryByText( "We couldn't load these comments. Please try again in a moment." )
		).not.toBeInTheDocument();
	} );
} );
