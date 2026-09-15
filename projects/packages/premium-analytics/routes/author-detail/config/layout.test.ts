import { AUTHOR_DETAIL_LAYOUT, AUTHOR_DETAIL_WIDGET_TYPE_ALIASES } from './index';

describe( 'author detail layout', () => {
	it( 'uses unique ids and no injected report params', () => {
		const uuids = AUTHOR_DETAIL_LAYOUT.map( widget => widget.uuid );
		expect( new Set( uuids ).size ).toBe( uuids.length );
		for ( const widget of AUTHOR_DETAIL_LAYOUT ) {
			expect( widget.attributes ?? {} ).not.toHaveProperty( 'reportParams' );
		}
	} );

	it( 'declares an alias for every scoped spotlight it renders, and renders every alias', () => {
		const aliased = AUTHOR_DETAIL_WIDGET_TYPE_ALIASES.flatMap( ( { variants } ) =>
			variants.map( variant => variant.name )
		);
		const scoped = AUTHOR_DETAIL_LAYOUT.filter(
			widget => ( widget.attributes as { authorScoped?: boolean } | undefined )?.authorScoped
		).map( widget => widget.type );

		expect( scoped.sort() ).toEqual( [ ...aliased ].sort() );
	} );
} );
