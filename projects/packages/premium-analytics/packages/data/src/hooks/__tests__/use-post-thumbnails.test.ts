/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { usePostThumbnails } from '../use-post-thumbnail';

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
	useEntityRecord: jest.fn(),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

const mockUseSelect = useSelect as jest.MockedFunction< typeof useSelect >;
const getEntityRecords = jest.fn();
const hasFinishedResolution = jest.fn< boolean, [ string, unknown[] ] >( () => true );

function mockEntityRecords( records: Record< string, unknown[] > ): void {
	getEntityRecords.mockImplementation(
		( _kind: string, name: string, query: { include: number[] } ) =>
			records[ name ]?.filter( record =>
				query.include.includes( ( record as { id: number } ).id )
			) ?? []
	);
	mockUseSelect.mockImplementation( mapSelect => {
		if ( typeof mapSelect !== 'function' ) {
			throw new Error( 'Expected a useSelect mapping function' );
		}

		return mapSelect(
			() => ( { getEntityRecords, hasFinishedResolution } ) as never,
			undefined as never
		) as never;
	} );
}

describe( 'usePostThumbnails', () => {
	beforeEach( () => {
		getEntityRecords.mockReset();
		hasFinishedResolution.mockReset();
		hasFinishedResolution.mockReturnValue( true );
		mockUseSelect.mockReset();
	} );

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
			_fields: 'id,featured_media',
		} );
		expect( getEntityRecords ).toHaveBeenCalledWith( 'postType', 'page', {
			include: [ 2 ],
			per_page: 1,
			_fields: 'id,featured_media',
		} );
		expect( getEntityRecords ).toHaveBeenCalledWith( 'postType', 'attachment', {
			include: [ 11, 12 ],
			per_page: 2,
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
