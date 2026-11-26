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

// The posts report's row batch size.
const ROWS_PER_QUERY = 50;

const mockUseSelect = useSelect as jest.MockedFunction< typeof useSelect >;
const getEntityRecord = jest.fn();
const getEntityRecords = jest.fn();

function mockSelectors(): void {
	mockUseSelect.mockImplementation( mapSelect => {
		if ( typeof mapSelect !== 'function' ) {
			throw new Error( 'Expected a useSelect mapping function' );
		}

		return mapSelect(
			() => ( { getEntityRecord, getEntityRecords } ) as never,
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

	it( 'batches mounted posts by type and their featured media', () => {
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
			usePostThumbnails(
				[
					{ id: 2, type: 'page' },
					{ id: 1, type: 'post' },
					{ id: 0, type: 'homepage' },
					{ id: undefined, type: 'post' },
				],
				ROWS_PER_QUERY
			)
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
			include: [ 11 ],
			per_page: 1,
			context: 'view',
			_fields: 'id,source_url,media_details',
		} );
		expect( getEntityRecords ).toHaveBeenCalledWith( 'postType', 'attachment', {
			include: [ 12 ],
			per_page: 1,
			context: 'view',
			_fields: 'id,source_url,media_details',
		} );
		expect( getEntityRecords ).not.toHaveBeenCalledWith(
			'postType',
			'homepage',
			expect.anything()
		);
	} );

	it.each( [
		[ '150 posts', { post: 150 }, { post: 3, attachment: 3 } ],
		[ '150 posts and 150 pages', { post: 150, page: 150 }, { post: 3, page: 3, attachment: 6 } ],
	] )(
		'resolves every thumbnail for %s with one query per run of 50 rows',
		( _description, countsByType: Record< string, number >, expectedBatches ) => {
			const rows: { id: number; type: string }[] = [];
			const records: Record< string, unknown[] > = { attachment: [] };
			let id = 0;
			for ( const [ type, count ] of Object.entries( countsByType ) ) {
				records[ type ] = [];
				for ( let index = 0; index < count; index++ ) {
					id++;
					rows.push( { id, type } );
					records[ type ].push( { id, featured_media: 1000 + id } );
					records.attachment.push( {
						id: 1000 + id,
						source_url: `https://example.com/${ id }.jpg`,
					} );
				}
			}
			mockEntityRecords( records );

			const { result } = renderHook( () => usePostThumbnails( rows, ROWS_PER_QUERY ) );

			expect( result.current ).toEqual(
				Object.fromEntries( rows.map( row => [ row.id, `https://example.com/${ row.id }.jpg` ] ) )
			);
			// useSelect reruns its mapping on every render, so count distinct queries.
			const batches = new Map< string, string >();
			for ( const [ , name, query ] of getEntityRecords.mock.calls ) {
				expect( query.per_page ).toBe( query.include.length );
				batches.set( `${ name }:${ query.include }`, name );
			}
			const batchCounts: Record< string, number > = {};
			for ( const name of batches.values() ) {
				batchCounts[ name ] = ( batchCounts[ name ] ?? 0 ) + 1;
			}
			expect( batchCounts ).toEqual( expectedBatches );
		}
	);

	it( 'keeps the queries it already made when the table mounts more rows', () => {
		const records: Record< string, unknown[] > = { post: [], attachment: [] };
		for ( let id = 1; id <= 100; id++ ) {
			records.post.push( { id, featured_media: 1000 + id } );
			records.attachment.push( { id: 1000 + id, source_url: `https://example.com/${ id }.jpg` } );
		}
		mockEntityRecords( records );
		const postRows = ( count: number ) =>
			Array.from( { length: count }, ( _, index ) => ( { id: index + 1, type: 'post' } ) );
		const queries = ( name: string ) =>
			new Set(
				getEntityRecords.mock.calls
					.filter( ( [ , queried ] ) => queried === name )
					.map( ( [ , , query ] ) => String( query.include ) )
			);

		const { rerender } = renderHook(
			( rows: { id: number; type: string }[] ) => usePostThumbnails( rows, ROWS_PER_QUERY ),
			{ initialProps: postRows( 50 ) }
		);
		const [ firstPosts ] = queries( 'post' );
		const [ firstMedia ] = queries( 'attachment' );
		getEntityRecords.mockClear();
		rerender( postRows( 100 ) );

		expect( queries( 'post' ) ).toContain( firstPosts );
		expect( queries( 'attachment' ) ).toContain( firstMedia );
	} );

	it( 'keeps the thumbnails it showed while a re-sorted row list resolves', () => {
		const records: Record< string, unknown[] > = { post: [], attachment: [] };
		for ( let id = 1; id <= 60; id++ ) {
			records.post.push( { id, featured_media: 1000 + id } );
			records.attachment.push( { id: 1000 + id, source_url: `https://example.com/${ id }.jpg` } );
		}
		mockEntityRecords( records );
		const postRows = ( count: number ) =>
			Array.from( { length: count }, ( _, index ) => ( { id: index + 1, type: 'post' } ) );

		const { result, rerender } = renderHook(
			( rows: { id: number; type: string }[] ) => usePostThumbnails( rows, ROWS_PER_QUERY ),
			{ initialProps: postRows( 60 ) }
		);
		expect( result.current[ 1 ] ).toBe( 'https://example.com/1.jpg' );

		// Re-sorted, the rows fall into new queries, unresolved until their requests return.
		getEntityRecords.mockReturnValue( null );
		rerender( [ ...postRows( 60 ) ].reverse() );

		expect( result.current[ 1 ] ).toBe( 'https://example.com/1.jpg' );
	} );

	it( 'drops a thumbnail once its post resolves without a featured image', () => {
		const records: Record< string, unknown[] > = {
			post: [
				{ id: 1, featured_media: 11 },
				{ id: 2, featured_media: 12 },
			],
			attachment: [
				{ id: 11, source_url: 'https://example.com/1.jpg' },
				{ id: 12, source_url: 'https://example.com/2.jpg' },
			],
		};
		mockEntityRecords( records );
		const { result, rerender } = renderHook(
			( rows: { id: number; type: string }[] ) => usePostThumbnails( rows, ROWS_PER_QUERY ),
			{
				initialProps: [
					{ id: 1, type: 'post' },
					{ id: 2, type: 'post' },
				],
			}
		);
		expect( result.current[ 1 ] ).toBe( 'https://example.com/1.jpg' );

		records.post[ 0 ] = { id: 1, featured_media: 0 };
		rerender( [
			{ id: 2, type: 'post' },
			{ id: 1, type: 'post' },
		] );

		expect( result.current ).toEqual( { 2: 'https://example.com/2.jpg' } );
	} );

	it( 'makes no entity requests without eligible rows', () => {
		mockEntityRecords( {} );

		const { result } = renderHook( () =>
			usePostThumbnails(
				[
					{ id: 0, type: 'homepage' },
					{ id: 'not-a-post', type: 'post' },
				],
				ROWS_PER_QUERY
			)
		);

		expect( result.current ).toEqual( {} );
		expect( getEntityRecords ).not.toHaveBeenCalled();
	} );
} );
