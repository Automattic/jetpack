/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { usePostThumbnail, usePostThumbnails } from '../use-post-thumbnail';

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

const mockUseSelect = useSelect as jest.MockedFunction< typeof useSelect >;
const getEntityRecord = jest.fn();
const getEntityRecords = jest.fn();
const hasFinishedResolution = jest.fn< boolean, [ string, unknown[] ] >( () => true );

function mockSelectors(): void {
	mockUseSelect.mockImplementation( mapSelect => {
		if ( typeof mapSelect !== 'function' ) {
			throw new Error( 'Expected a useSelect mapping function' );
		}

		return mapSelect(
			() => ( { getEntityRecord, getEntityRecords, hasFinishedResolution } ) as never,
			undefined as never
		) as never;
	} );
}

function mockEntities( records: Record< string, unknown > ): void {
	getEntityRecord.mockImplementation(
		( _kind: string, name: string, id: number ) => records[ `${ name }:${ id }` ]
	);
	mockSelectors();
}

function mockEntityRecords( records: Record< string, unknown[] > ): void {
	getEntityRecords.mockImplementation(
		( _kind: string, name: string, query: { include: number[] } ) =>
			records[ name ]?.filter( record =>
				query.include.includes( ( record as { id: number } ).id )
			) ?? []
	);
	mockSelectors();
}

function resetSelectors(): void {
	getEntityRecord.mockReset();
	getEntityRecords.mockReset();
	hasFinishedResolution.mockReset();
	hasFinishedResolution.mockReturnValue( true );
	mockUseSelect.mockReset();
}

describe( 'usePostThumbnail', () => {
	beforeEach( resetSelectors );

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

describe( 'usePostThumbnails', () => {
	beforeEach( resetSelectors );

	it( 'batches visible posts by type and their featured media', () => {
		mockEntityRecords( {
			post: [ { id: 1, featured_media: 11 } ],
			page: [ { id: 2, featured_media: 12 } ],
			attachment: [
				{
					id: 11,
					source_url: 'https://example.com/post-full.jpg',
					media_details: {
						sizes: { thumbnail: { source_url: 'https://example.com/post-thumb.jpg' } },
					},
				},
				{ id: 12, source_url: 'https://example.com/page-full.jpg' },
			],
		} );

		const { result } = renderHook( () =>
			usePostThumbnails( [
				{ id: 2, type: 'page' },
				{ id: 1, type: 'post' },
				{ id: 0, type: 'homepage' },
				{ id: undefined, type: 'post' },
			] )
		);

		expect( result.current ).toEqual( {
			1: 'https://example.com/post-thumb.jpg',
			2: 'https://example.com/page-full.jpg',
		} );
		expect( getEntityRecords ).toHaveBeenCalledWith( 'postType', 'post', {
			include: [ 1 ],
			per_page: 1,
			context: 'view',
			_fields: 'id,featured_media',
		} );
		expect( getEntityRecords ).toHaveBeenCalledWith( 'postType', 'page', {
			include: [ 2 ],
			per_page: 1,
			context: 'view',
			_fields: 'id,featured_media',
		} );
		expect( getEntityRecords ).toHaveBeenCalledWith( 'postType', 'attachment', {
			include: [ 11, 12 ],
			per_page: 2,
			context: 'view',
			_fields: 'id,source_url,media_details',
		} );
		expect( getEntityRecords ).not.toHaveBeenCalledWith(
			'postType',
			'homepage',
			expect.anything()
		);
	} );

	it( 'makes no entity requests without eligible rows', () => {
		mockEntityRecords( {} );

		const { result } = renderHook( () =>
			usePostThumbnails( [
				{ id: 0, type: 'homepage' },
				{ id: 'not-a-post', type: 'post' },
			] )
		);

		expect( result.current ).toEqual( {} );
		expect( getEntityRecords ).not.toHaveBeenCalled();
	} );

	it( 'waits for every post type before requesting media', () => {
		mockEntityRecords( {
			post: [ { id: 1, featured_media: 11 } ],
			page: [ { id: 2, featured_media: 12 } ],
		} );
		hasFinishedResolution.mockImplementation(
			( _selectorName, args ) => ( args as [ string, string ] )[ 1 ] !== 'page'
		);

		renderHook( () =>
			usePostThumbnails( [
				{ id: 1, type: 'post' },
				{ id: 2, type: 'page' },
			] )
		);

		expect( getEntityRecords ).not.toHaveBeenCalledWith(
			'postType',
			'attachment',
			expect.anything()
		);
	} );
} );
