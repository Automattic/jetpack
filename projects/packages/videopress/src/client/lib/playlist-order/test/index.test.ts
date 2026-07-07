/**
 * Internal dependencies
 */
import { orderPlaylistVideos, resolveOrderedIds } from '..';

describe( 'resolveOrderedIds', () => {
	it( 'keeps the stored order for ids that are still members', () => {
		expect( resolveOrderedIds( [ 3, 1, 2 ], [ 1, 2, 3 ] ) ).toEqual( [ 3, 1, 2 ] );
	} );

	it( 'drops order entries that are no longer members', () => {
		expect( resolveOrderedIds( [ 9, 3, 8, 1 ], [ 1, 3 ] ) ).toEqual( [ 3, 1 ] );
	} );

	it( 'appends members missing from the order, in member (date) sequence', () => {
		expect( resolveOrderedIds( [ 2 ], [ 5, 4, 2, 6 ] ) ).toEqual( [ 2, 5, 4, 6 ] );
	} );

	it( 'drops stale entries and appends missing members in one pass', () => {
		expect( resolveOrderedIds( [ 9, 2, 7 ], [ 5, 2, 6 ] ) ).toEqual( [ 2, 5, 6 ] );
	} );

	it( 'dedupes repeated order entries keeping the first position', () => {
		expect( resolveOrderedIds( [ 2, 1, 2, 1 ], [ 1, 2 ] ) ).toEqual( [ 2, 1 ] );
	} );

	it( 'returns members as-is when there is no stored order', () => {
		expect( resolveOrderedIds( [], [ 4, 2, 3 ] ) ).toEqual( [ 4, 2, 3 ] );
	} );

	it( 'returns empty when there are no members', () => {
		expect( resolveOrderedIds( [ 1, 2, 3 ], [] ) ).toEqual( [] );
	} );
} );

describe( 'orderPlaylistVideos', () => {
	const video = ( id: number ) => ( { id, title: `Video ${ id }` } );

	it( 'materializes videos in the reconciled order', () => {
		const videos = [ video( 1 ), video( 2 ), video( 3 ) ];
		expect( orderPlaylistVideos( videos, [ 3, 9, 1 ] ).map( v => v.id ) ).toEqual( [ 3, 1, 2 ] );
	} );

	it( 'returns the original items, not copies', () => {
		const videos = [ video( 1 ), video( 2 ) ];
		expect( orderPlaylistVideos( videos, [ 2, 1 ] ) ).toEqual( [ videos[ 1 ], videos[ 0 ] ] );
		expect( orderPlaylistVideos( videos, [ 2, 1 ] )[ 0 ] ).toBe( videos[ 1 ] );
	} );

	it( 'passes empty inputs through', () => {
		expect( orderPlaylistVideos( [], [ 1, 2 ] ) ).toEqual( [] );
	} );
} );
