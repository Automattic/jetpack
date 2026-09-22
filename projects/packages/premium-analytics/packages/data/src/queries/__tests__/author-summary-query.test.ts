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

	it( 'reads the identity fields off the users endpoint', async () => {
		mockApiFetch.mockResolvedValueOnce( {
			id: 7,
			name: 'Priya',
			avatar_urls: { '96': 'https://g/96' },
		} );

		await expect( run( 7 ) ).resolves.toEqual( {
			id: 7,
			name: 'Priya',
			avatarUrl: 'https://g/96',
		} );

		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/users/7?_fields=id%2Cname%2Cavatar_urls',
		} );
	} );

	it( 'resolves to null when the users endpoint knows no such user', async () => {
		mockApiFetch.mockRejectedValueOnce( { code: 'rest_user_invalid_id', data: { status: 404 } } );

		await expect( run( 7 ) ).resolves.toBeNull();
	} );

	it.each( [
		[ 'rest_user_cannot_view', 403 ],
		[ 'rest_forbidden', 403 ],
		[ 'internal_server_error', 500 ],
		[ 'rest_no_route', 404 ],
	] )( 'rethrows a %s failure whatever its status', async ( code, status ) => {
		const error = { code, data: { status } };
		mockApiFetch.mockRejectedValueOnce( error );

		await expect( run( 7 ) ).rejects.toBe( error );
	} );
} );
