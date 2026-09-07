import apiFetch from '@wordpress/api-fetch';
import { suggestGuidelines } from '../lib/api';

jest.mock( '@wordpress/api-fetch' );

describe( 'suggestGuidelines', () => {
	beforeEach( () => jest.clearAllMocks() );

	it( 'sends standard sections as top-level keys with empty objects when no existing content', async () => {
		apiFetch.mockResolvedValue( { site: { guidelines: 'S' }, copy: { guidelines: 'C' } } );

		const result = await suggestGuidelines( [ 'site', 'copy' ] );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/jetpack-ai/suggest-guidelines',
			method: 'POST',
			data: { categories: { site: {}, copy: {} } },
		} );
		expect( result ).toEqual( { suggestions: { site: 'S', copy: 'C' } } );
	} );

	it( 'passes existing content as { guidelines } so the endpoint refines instead of generating', async () => {
		apiFetch.mockResolvedValue( { copy: { guidelines: 'C2' } } );

		await suggestGuidelines( [ 'copy' ], { copy: 'Write casually.' } );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				data: { categories: { copy: { guidelines: 'Write casually.' } } },
			} )
		);
	} );

	it( 'routes non-section slugs under blocks and reads them back from response.blocks', async () => {
		apiFetch.mockResolvedValue( { blocks: { 'core/paragraph': { guidelines: 'P' } } } );

		const result = await suggestGuidelines( [ 'core/paragraph' ], { 'core/paragraph': 'x' } );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				data: { categories: { blocks: { 'core/paragraph': { guidelines: 'x' } } } },
			} )
		);
		expect( result ).toEqual( { suggestions: { 'core/paragraph': 'P' } } );
	} );

	it( 'mixes sections and blocks in a single request', async () => {
		apiFetch.mockResolvedValue( {} );

		await suggestGuidelines( [ 'site', 'core/image' ] );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				data: { categories: { site: {}, blocks: { 'core/image': {} } } },
			} )
		);
	} );

	it( 'omits slugs the response does not return a guideline for', async () => {
		apiFetch.mockResolvedValue( { site: {}, blocks: { 'core/image': {} } } );

		const result = await suggestGuidelines( [ 'site', 'core/image' ] );

		expect( result ).toEqual( { suggestions: {} } );
	} );
} );
