/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
import { useEntityRecord } from '@wordpress/core-data';
/**
 * Internal dependencies
 */
import { usePostThumbnail } from '../use-post-thumbnail';

jest.mock( '@wordpress/core-data', () => ( {
	useEntityRecord: jest.fn(),
} ) );

const mockUseEntityRecord = useEntityRecord as jest.MockedFunction< typeof useEntityRecord >;

function mockEntities( records: Record< string, unknown > ): void {
	mockUseEntityRecord.mockImplementation(
		( _kind, name, id, options ) =>
			( {
				record: options?.enabled ? records[ `${ name }:${ id }` ] : undefined,
			} ) as ReturnType< typeof useEntityRecord >
	);
}

describe( 'usePostThumbnail', () => {
	beforeEach( () => {
		mockUseEntityRecord.mockReset();
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
		expect( mockUseEntityRecord ).toHaveBeenLastCalledWith( 'postType', 'attachment', 0, {
			enabled: false,
		} );
	} );

	it.each( [
		[ 'a missing post type', 41, undefined ],
		[ 'a non-numeric post ID', 'not-a-post', 'post' ],
		[ 'a non-positive post ID', 0, 'post' ],
	] )( 'disables entity resolution for %s', ( _description, postId, postType ) => {
		mockEntities( {} );

		const { result } = renderHook( () => usePostThumbnail( postId, postType ) );

		expect( result.current ).toBeUndefined();
		expect( mockUseEntityRecord ).toHaveBeenNthCalledWith(
			1,
			'postType',
			postType ?? '',
			Number( postId ),
			{ enabled: false }
		);
	} );
} );
