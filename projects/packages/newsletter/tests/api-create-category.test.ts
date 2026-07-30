/**
 * Unit tests for `createCategory` in the Newsletter settings API (NL-785).
 *
 * The component test (`newsletter-categories-section.test.tsx`) mocks this whole
 * module, so it never exercises the real request/normalization logic. These tests
 * drive `createCategory` directly to cover both transport branches. WordPress.com
 * Simple sites POST to the WPCOM taxonomy endpoint and get back an uppercase `ID`,
 * which we normalize to `id`; self-hosted sites POST to `/wp/v2/categories` and
 * already return a lowercase `id`.
 */

const mockApiFetch = jest.fn();

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

const mockGetSiteData = jest.fn();
const mockIsSimpleSite = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	__esModule: true,
	getSiteData: ( ...args: unknown[] ) => mockGetSiteData( ...args ),
	isSimpleSite: ( ...args: unknown[] ) => mockIsSimpleSite( ...args ),
} ) );

import { createCategory } from '../src/settings/api';

describe( 'createCategory (NL-785)', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'creates via the WPCOM endpoint and normalizes ID→id on Simple sites', async () => {
		mockIsSimpleSite.mockReturnValue( true );
		mockGetSiteData.mockReturnValue( { wpcom: { blog_id: 123 } } );
		// WordPress.com returns an uppercase `ID`.
		mockApiFetch.mockResolvedValue( { ID: 42, name: 'Weekly Digest' } );

		const result = await createCategory( 'Weekly Digest' );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/rest/v1.1/sites/123/taxonomies/category/terms/new',
			method: 'POST',
			data: { name: 'Weekly Digest' },
		} );
		expect( result ).toEqual( { id: 42, name: 'Weekly Digest' } );
	} );

	it( 'creates via the WP REST endpoint on self-hosted sites', async () => {
		mockIsSimpleSite.mockReturnValue( false );
		mockGetSiteData.mockReturnValue( { wpcom: { blog_id: 123 } } );
		mockApiFetch.mockResolvedValue( { id: 7, name: 'Monthly Roundup' } );

		const result = await createCategory( 'Monthly Roundup' );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/categories',
			method: 'POST',
			data: { name: 'Monthly Roundup' },
		} );
		expect( result ).toEqual( { id: 7, name: 'Monthly Roundup' } );
	} );

	it( 'falls back to the WP REST endpoint when a Simple site has no blog ID', async () => {
		mockIsSimpleSite.mockReturnValue( true );
		mockGetSiteData.mockReturnValue( { wpcom: { blog_id: 0 } } );
		mockApiFetch.mockResolvedValue( { id: 9, name: 'News' } );

		const result = await createCategory( 'News' );

		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: '/wp/v2/categories' } )
		);
		expect( result ).toEqual( { id: 9, name: 'News' } );
	} );

	it( 'propagates API errors (e.g. duplicate term) to the caller', async () => {
		mockIsSimpleSite.mockReturnValue( false );
		mockGetSiteData.mockReturnValue( { wpcom: { blog_id: 123 } } );
		mockApiFetch.mockRejectedValue(
			Object.assign( new Error( 'A term with the name provided already exists.' ), {
				code: 'term_exists',
			} )
		);

		await expect( createCategory( 'News' ) ).rejects.toMatchObject( { code: 'term_exists' } );
	} );

	it( 'rejects when the success payload has no numeric id', async () => {
		mockIsSimpleSite.mockReturnValue( false );
		mockGetSiteData.mockReturnValue( { wpcom: { blog_id: 123 } } );
		// Malformed response: no id — must not resolve to a bogus category.
		mockApiFetch.mockResolvedValue( { name: 'News' } );

		await expect( createCategory( 'News' ) ).rejects.toThrow();
	} );

	it( 'throws a duplicate-signal error when the WPCOM proxy resolves with an error envelope', async () => {
		mockIsSimpleSite.mockReturnValue( true );
		mockGetSiteData.mockReturnValue( { wpcom: { blog_id: 123 } } );
		// On Simple a duplicate can resolve (not reject) with an error envelope.
		mockApiFetch.mockResolvedValue( {
			code: 409,
			body: { error: 'duplicate', message: 'A taxonomy with that name already exists' },
		} );

		await expect( createCategory( 'News' ) ).rejects.toMatchObject( {
			code: 409,
			error: 'duplicate',
		} );
	} );
} );
