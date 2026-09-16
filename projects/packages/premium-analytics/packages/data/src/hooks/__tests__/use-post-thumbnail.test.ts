/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { usePostThumbnail } from '../use-post-thumbnail';

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

const mockUseSelect = useSelect as jest.MockedFunction< typeof useSelect >;
const getEntityRecord = jest.fn();

function mockEntities( records: Record< string, unknown > ): void {
	getEntityRecord.mockImplementation(
		( _kind: string, name: string, id: number ) => records[ `${ name }:${ id }` ]
	);
	mockUseSelect.mockImplementation( mapSelect => {
		if ( typeof mapSelect !== 'function' ) {
			throw new Error( 'Expected a useSelect mapping function' );
		}

		return mapSelect( () => ( { getEntityRecord } ) as never, undefined as never ) as never;
	} );
}

describe( 'usePostThumbnail', () => {
	beforeEach( () => {
		getEntityRecord.mockReset();
		mockUseSelect.mockReset();
	} );

	it( 'resolves the post thumbnail through its featured media', () => {
		mockEntities( {
			'post:41': { featured_media: 7 },
			'attachment:7': {
				media_details: { sizes: { thumbnail: { source_url: 'https://example.com/thumb.jpg' } } },
				source_url: 'https://example.com/full.jpg',
			},
		} );

		const { result } = renderHook( () => usePostThumbnail( 41, 'post' ) );

		expect( result.current ).toBe( 'https://example.com/thumb.jpg' );
		expect( getEntityRecord ).toHaveBeenCalledWith( 'postType', 'post', 41, {
			context: 'view',
		} );
		expect( getEntityRecord ).toHaveBeenCalledWith( 'postType', 'attachment', 7, {
			context: 'view',
		} );
	} );

	it( 'falls back to the full-size media source', () => {
		mockEntities( {
			'page:41': { featured_media: 9 },
			'attachment:9': { source_url: 'https://example.com/full.jpg' },
		} );

		const { result } = renderHook( () => usePostThumbnail( 41, 'page' ) );

		expect( result.current ).toBe( 'https://example.com/full.jpg' );
	} );

	it( 'does not resolve media when the post has no featured image', () => {
		mockEntities( { 'post:41': { featured_media: 0 } } );

		const { result } = renderHook( () => usePostThumbnail( 41, 'post' ) );

		expect( result.current ).toBeUndefined();
		expect( getEntityRecord ).not.toHaveBeenCalledWith(
			'postType',
			'attachment',
			expect.anything(),
			expect.anything()
		);
	} );

	it.each( [
		[ 'a missing post type', 41, undefined ],
		[ 'a non-numeric post ID', 'not-a-post', 'post' ],
		[ 'a non-positive post ID', 0, 'post' ],
	] )( 'disables entity resolution for %s', ( _description, postId, postType ) => {
		mockEntities( {} );

		const { result } = renderHook( () => usePostThumbnail( postId, postType ) );

		expect( result.current ).toBeUndefined();
		expect( getEntityRecord ).not.toHaveBeenCalled();
	} );
} );
