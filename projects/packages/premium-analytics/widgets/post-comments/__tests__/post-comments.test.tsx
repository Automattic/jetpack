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
import * as fittedRoster from '../../../packages/widgets-toolkit/src/components/subscriber-list/use-fitted-roster-rows';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const COMMENT = {
	ID: 101,
	author: { name: 'Olivia Park' },
	URL: 'https://example.com/post/#comment-101',
	date: new Date().toISOString(),
};

/** Answers the comments request from `replies` and the post stats request from `post`. */
function mockEndpoints( replies: jest.Mock, post: Record< string, unknown > ) {
	mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
		path.includes( '/replies' ) ? replies() : Promise.resolve( { post } )
	);
}

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
		jest.useFakeTimers();
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	afterEach( () => {
		jest.restoreAllMocks();
		jest.useRealTimers();
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
		const replies = jest
			.fn()
			.mockResolvedValueOnce( { found: 1, comments: [ COMMENT ] } )
			.mockRejectedValueOnce( { status: 403 } );
		mockEndpoints( replies, {} );

		renderWidget( 779 );

		await expect(
			screen.findByRole( 'link', { name: /Olivia Park/ } )
		).resolves.toBeInTheDocument();

		await act( async () => {
			await queryClient.invalidateQueries( { queryKey: [ 'stats', 'post-comments' ] } );
		} );

		await waitFor( () => expect( replies ).toHaveBeenCalledTimes( 2 ) );
		expect( screen.getByRole( 'link', { name: /Olivia Park/ } ) ).toBeInTheDocument();
		expect(
			screen.queryByText( "We couldn't load these comments. Please try again in a moment." )
		).not.toBeInTheDocument();
	} );

	it( 'takes the total from the post when the comments request cannot count them', async () => {
		mockEndpoints( jest.fn().mockResolvedValue( { found: -1, comments: [ COMMENT ] } ), {
			comment_count: 30,
		} );

		renderWidget( 779 );

		await expect( screen.findByText( '29 more' ) ).resolves.toBeInTheDocument();
	} );

	it.each( [
		[ undefined, null ],
		[ 30, '29 more' ],
	] )( 'handles an overflowing list with post total %s', async ( commentCount, expectedFooter ) => {
		jest.spyOn( fittedRoster, 'useFittedRosterRows' ).mockReturnValue( {
			listRef: { current: null },
			fittedCount: 1,
		} );
		mockEndpoints(
			jest.fn().mockResolvedValue( {
				found: -1,
				comments: [ COMMENT, { ...COMMENT, ID: 102 } ],
			} ),
			{ comment_count: commentCount }
		);

		renderWidget( 779 );

		await expect(
			screen.findByRole( 'link', { name: /Olivia Park/ } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( /\d+ more/ )?.textContent ?? null ).toBe( expectedFooter );
	} );

	it( 'prefers the total the comments request counted over the post row', async () => {
		mockEndpoints( jest.fn().mockResolvedValue( { found: 24, comments: [ COMMENT ] } ), {
			comment_count: 99,
		} );

		renderWidget( 779 );

		await expect( screen.findByText( '23 more' ) ).resolves.toBeInTheDocument();
	} );
} );
