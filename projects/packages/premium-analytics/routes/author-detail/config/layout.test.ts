import { AUTHOR_DETAIL_LAYOUT } from './index';

describe( 'author detail layout', () => {
	it( 'uses unique ids and no injected report params', () => {
		const uuids = AUTHOR_DETAIL_LAYOUT.map( widget => widget.uuid );
		expect( new Set( uuids ).size ).toBe( uuids.length );
		for ( const widget of AUTHOR_DETAIL_LAYOUT ) {
			expect( widget.attributes ?? {} ).not.toHaveProperty( 'reportParams' );
		}
	} );

	it( 'scopes the spotlights through the registered author variants', () => {
		const scoped = AUTHOR_DETAIL_LAYOUT.filter(
			widget => ( widget.attributes as { authorScoped?: boolean } | undefined )?.authorScoped
		).map( widget => widget.type );

		expect( scoped.sort() ).toEqual( [
			'jpa/latest-post--author',
			'jpa/popular-post--author',
			'jpa/views-over-years--author',
		] );
	} );
} );
