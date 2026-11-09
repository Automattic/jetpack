import { AUTHOR_DETAIL_LAYOUT } from './index';

describe( 'author detail layout', () => {
	it( 'uses unique ids and no injected report params', () => {
		const uuids = AUTHOR_DETAIL_LAYOUT.map( widget => widget.uuid );
		expect( new Set( uuids ).size ).toBe( uuids.length );
		for ( const widget of AUTHOR_DETAIL_LAYOUT ) {
			expect( widget.attributes ?? {} ).not.toHaveProperty( 'reportParams' );
		}
	} );
} );
