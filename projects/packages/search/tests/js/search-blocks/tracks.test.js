import {
	identifySite,
	recordTrainTracksInteract,
	recordTrainTracksRender,
} from '../../../src/search-blocks/store/tracks';

describe( 'search-blocks tracks', () => {
	beforeEach( () => {
		delete window._tkq;
	} );

	it( 'lazily creates window._tkq and records a render event under the instant-search name', () => {
		recordTrainTracksRender( { railcar: 'abc', ui_position: 0 } );
		expect( window._tkq[ 0 ][ 0 ] ).toBe( 'recordEvent' );
		expect( window._tkq[ 0 ][ 1 ] ).toBe( 'jetpack_instant_search_traintracks_render' );
		expect( window._tkq[ 0 ][ 2 ] ).toMatchObject( { railcar: 'abc', ui_position: 0 } );
	} );

	it( 'records an interact event under the instant-search name', () => {
		recordTrainTracksInteract( { railcar: 'abc', action: 'click' } );
		expect( window._tkq[ 0 ][ 1 ] ).toBe( 'jetpack_instant_search_traintracks_interact' );
		expect( window._tkq[ 0 ][ 2 ] ).toMatchObject( { railcar: 'abc', action: 'click' } );
	} );

	it( 'merges blog_id from identifySite into every event', () => {
		identifySite( 12345 );
		recordTrainTracksRender( { railcar: 'xyz', ui_position: 2 } );
		expect( window._tkq[ 0 ][ 2 ] ).toMatchObject( {
			blog_id: 12345,
			railcar: 'xyz',
			ui_position: 2,
		} );
	} );

	it( 'appends to an existing queue rather than replacing it', () => {
		window._tkq = [ [ 'recordEvent', 'pre_existing', {} ] ];
		recordTrainTracksRender( { railcar: 'abc' } );
		expect( window._tkq ).toHaveLength( 2 );
		expect( window._tkq[ 1 ][ 1 ] ).toBe( 'jetpack_instant_search_traintracks_render' );
	} );
} );
