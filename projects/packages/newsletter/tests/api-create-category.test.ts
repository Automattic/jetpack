/**
 * Unit tests for `createCategory` in the Newsletter settings API (NL-785).
 *
 * `createCategory` posts to `/wp/v2/categories` on every platform — in the
 * wp-admin context WordPress.com proxies it and returns standard WP-REST
 * responses, unlike the older wpcom taxonomy endpoint whose error body apiFetch
 * can't parse (it collapses duplicates to a generic `unknown_error`).
 */

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	__esModule: true,
	getSiteData: jest.fn( () => ( { wpcom: { blog_id: 123 } } ) ),
	isSimpleSite: jest.fn( () => false ),
} ) );

import { createCategory } from '../src/settings/api';

describe( 'createCategory (NL-785)', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'creates via the /wp/v2/categories endpoint', async () => {
		mockApiFetch.mockResolvedValue( { id: 7, name: 'Monthly Roundup' } );

		const result = await createCategory( 'Monthly Roundup' );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/categories',
			method: 'POST',
			data: { name: 'Monthly Roundup' },
		} );
		expect( result ).toEqual( { id: 7, name: 'Monthly Roundup' } );
	} );

	it( 'propagates a duplicate (term_exists) rejection to the caller', async () => {
		mockApiFetch.mockRejectedValue(
			Object.assign( new Error( 'A term with the name provided already exists.' ), {
				code: 'term_exists',
			} )
		);

		await expect( createCategory( 'News' ) ).rejects.toMatchObject( { code: 'term_exists' } );
	} );

	it( 'rejects when the success payload has no numeric id', async () => {
		// Malformed response: no id — must not resolve to a bogus category.
		mockApiFetch.mockResolvedValue( { name: 'News' } );

		await expect( createCategory( 'News' ) ).rejects.toThrow();
	} );
} );
