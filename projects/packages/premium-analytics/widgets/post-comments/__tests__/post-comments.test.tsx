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

function makeComments( count: number, firstId: number ) {
	return Array.from( { length: count }, ( _, index ) => ( {
		...COMMENT,
		ID: firstId + index,
		author: { name: `Commenter ${ firstId + index }` },
	} ) );
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
		mockApiFetch.mockResolvedValue( { comments: [] } );

		renderWidget( 779 );

		await expect( screen.findByText( 'There are no comments yet.' ) ).resolves.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: expect.stringContaining( '/proxy/v1.1/posts/779/replies' ),
			} )
		);
	} );

	it( 'renders commenters, comment links, and the remaining count from found', async () => {
		mockApiFetch.mockResolvedValue( {
			found: 12,
			comments: [
				{
					...COMMENT,
					author: { name: 'Olivia Park', avatar_URL: 'https://gravatar.com/avatar/1' },
				},
				...makeComments( 9, 102 ),
			],
		} );

		renderWidget( 779 );

		const author = await screen.findByRole( 'link', { name: /Olivia Park/ } );
		expect( author ).toHaveAttribute( 'href', 'https://example.com/post/#comment-101' );
		await expect( screen.findByText( '2 more' ) ).resolves.toBeInTheDocument();
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
			.mockResolvedValueOnce( { comments: [ COMMENT ] } )
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

	it.each( [
		[ 2, 2, '1 more' ],
		[ 10, 30, '29 more' ],
		[ 10, -1, '9 more' ],
	] )(
		'counts %s fetched comments, one fitted, with found %s as %s',
		async ( fetched, found, expectedFooter ) => {
			jest.spyOn( fittedRoster, 'useFittedRosterRows' ).mockReturnValue( {
				listRef: { current: null },
				fittedCount: 1,
			} );
			mockApiFetch.mockResolvedValue( { found, comments: makeComments( fetched, 101 ) } );

			renderWidget( 779 );

			await expect(
				screen.findByRole( 'link', { name: /Commenter 101/ } )
			).resolves.toBeInTheDocument();
			await waitFor( () =>
				expect( screen.queryByText( /\d+ more/ )?.textContent ?? null ).toBe( expectedFooter )
			);
		}
	);
} );
