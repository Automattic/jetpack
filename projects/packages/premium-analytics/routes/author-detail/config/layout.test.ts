import { PA_COLUMN_COUNT } from '../../grid';
import { AUTHOR_DETAIL_LAYOUT, AUTHOR_DETAIL_WIDGET_TYPE_ALIASES } from './index';

describe( 'author detail layout', () => {
	it( 'lays out the four cards in design order on the detail grid', () => {
		expect(
			AUTHOR_DETAIL_LAYOUT.map( ( { type, placement } ) => [
				type,
				placement?.width,
				placement?.order,
			] )
		).toEqual( [
			[ 'jpa/author-views', PA_COLUMN_COUNT, 1 ],
			[ 'jpa/popular-post--author', 2, 2 ],
			[ 'jpa/latest-post--author', 1, 3 ],
			[ 'jpa/author-top-posts', PA_COLUMN_COUNT, 4 ],
		] );
	} );

	it( 'uses unique ids and no injected report params', () => {
		const uuids = AUTHOR_DETAIL_LAYOUT.map( widget => widget.uuid );
		expect( new Set( uuids ).size ).toBe( uuids.length );
		for ( const widget of AUTHOR_DETAIL_LAYOUT ) {
			expect( widget.attributes ?? {} ).not.toHaveProperty( 'reportParams' );
		}
	} );

	it( 'aliases every scoped spotlight it renders', () => {
		const aliased = AUTHOR_DETAIL_WIDGET_TYPE_ALIASES.flatMap( ( { variants } ) =>
			variants.map( variant => variant.name )
		);

		expect( aliased ).toEqual( [ 'jpa/popular-post--author', 'jpa/latest-post--author' ] );
		for ( const { variants } of AUTHOR_DETAIL_WIDGET_TYPE_ALIASES ) {
			for ( const variant of variants ) {
				expect( variant.getTitle() ).not.toBe( '' );
				expect( variant.getHelp?.().content ).toMatch( /^This author's/ );
			}
		}
	} );
} );
