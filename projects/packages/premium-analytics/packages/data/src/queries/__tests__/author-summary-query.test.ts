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
import { authorSummaryQuery } from '../author-summary-query';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const user = { id: 7, name: 'Priya', avatar_urls: { '96': 'https://g/96' } };

function postsResponse( posts: unknown[], total: string ) {
	return new Response( JSON.stringify( posts ), {
		status: 200,
		headers: { 'Content-Type': 'application/json', 'X-WP-Total': total },
	} );
}

async function run( authorId: number ) {
	const { queryFn } = authorSummaryQuery( authorId );
	return ( queryFn as () => Promise< unknown > )();
}

describe( 'authorSummaryQuery', () => {
	afterEach( () => {
		mockApiFetch.mockReset();
	} );

	it( 'is disabled for a non-positive id', () => {
		expect( authorSummaryQuery( 0 ).enabled ).toBe( false );
		expect( authorSummaryQuery( 7 ).enabled ).toBe( true );
	} );

	it( 'joins the user with the oldest post and the posts total header', async () => {
		mockApiFetch
			.mockResolvedValueOnce( user )
			.mockResolvedValueOnce( postsResponse( [ { id: 3, date: '2023-07-04T10:00:00' } ], '12' ) );

		await expect( run( 7 ) ).resolves.toEqual( {
			id: 7,
			name: 'Priya',
			avatarUrl: 'https://g/96',
			postCount: 12,
			firstPublishedDate: '2023-07-04T10:00:00',
		} );

		expect( mockApiFetch ).toHaveBeenNthCalledWith( 1, {
			path: '/wp/v2/users/7?_fields=id%2Cname%2Cavatar_urls',
		} );
		expect( mockApiFetch ).toHaveBeenNthCalledWith( 2, {
			path: '/wp/v2/posts?author=7&status=publish&per_page=1&orderby=date&order=asc&_fields=id%2Cdate',
			parse: false,
		} );
	} );

	it( 'counts a pre-parsed posts page when there are no headers to read', async () => {
		mockApiFetch
			.mockResolvedValueOnce( user )
			.mockResolvedValueOnce( [ { id: 3, date: '2024-01-01' } ] );

		await expect( run( 7 ) ).resolves.toMatchObject( {
			postCount: 1,
			firstPublishedDate: '2024-01-01',
		} );
	} );

	it.each( [
		[ 404, { code: 'rest_user_invalid_id', data: { status: 404 } } ],
		[ 403, { code: 'rest_user_cannot_view', data: { status: 403 } } ],
	] )( 'resolves to null when the users endpoint answers %i', async ( _status, error ) => {
		mockApiFetch.mockRejectedValueOnce( error );

		await expect( run( 7 ) ).resolves.toBeNull();
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'rethrows any other users failure', async () => {
		const error = { code: 'internal_server_error', data: { status: 500 } };
		mockApiFetch.mockRejectedValueOnce( error );

		await expect( run( 7 ) ).rejects.toBe( error );
	} );
} );
