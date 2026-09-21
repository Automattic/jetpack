/**
 * Builds real `Response` objects to read the posts total header, and the shared
 * jsdom environment has no `Response` constructor.
 *
 * @jest-environment node
 */

/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { authorPostsQuery } from '../author-posts-query';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

function postsResponse( posts: unknown[], total: string ) {
	return new Response( JSON.stringify( posts ), {
		status: 200,
		headers: { 'Content-Type': 'application/json', 'X-WP-Total': total },
	} );
}

async function run( authorId: number ) {
	const { queryFn } = authorPostsQuery( authorId );
	return ( queryFn as () => Promise< unknown > )();
}

describe( 'authorPostsQuery', () => {
	afterEach( () => {
		mockApiFetch.mockReset();
	} );

	it( 'is disabled for a non-positive id', () => {
		expect( authorPostsQuery( 0 ).enabled ).toBe( false );
		expect( authorPostsQuery( 7 ).enabled ).toBe( true );
	} );

	it( 'reads the oldest post and the posts total header', async () => {
		mockApiFetch.mockResolvedValueOnce(
			postsResponse( [ { id: 3, date: '2023-07-04T10:00:00' } ], '12' )
		);

		await expect( run( 7 ) ).resolves.toEqual( {
			postCount: 12,
			firstPublishedDate: '2023-07-04T10:00:00',
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/posts?author=7&status=publish&per_page=1&orderby=date&order=asc&_fields=id%2Cdate',
			parse: false,
		} );
	} );

	it( 'counts a pre-parsed posts page when there are no headers to read', async () => {
		mockApiFetch.mockResolvedValueOnce( [ { id: 3, date: '2024-01-01' } ] );

		await expect( run( 7 ) ).resolves.toEqual( {
			postCount: 1,
			firstPublishedDate: '2024-01-01',
		} );
	} );

	it( 'normalizes a failed response so the status survives', async () => {
		mockApiFetch.mockRejectedValueOnce(
			new Response( JSON.stringify( { code: 'rest_forbidden', message: 'Sorry' } ), {
				status: 403,
				headers: { 'Content-Type': 'application/json' },
			} )
		);

		await expect( run( 7 ) ).rejects.toMatchObject( { code: 'rest_forbidden', status: 403 } );
	} );

	it( 'rethrows a plain error as is', async () => {
		const error = { code: 'internal_server_error', data: { status: 500 } };
		mockApiFetch.mockRejectedValueOnce( error );

		await expect( run( 7 ) ).rejects.toBe( error );
	} );
} );
