import { withPostTypeTitles } from './post-type-titles';
import type { WidgetType } from '@wordpress/widget-primitives';

const widgetTypes = [
	{ name: 'jpa/post-detail-highlights', title: 'Post highlights', help: 'Highlights help' },
	{ name: 'jpa/post-views', title: 'Post views' },
	{ name: 'jpa/post-likes', title: 'Post likes' },
] as unknown as WidgetType[];

describe( 'withPostTypeTitles', () => {
	it.each( [
		[ 'page', 'Page highlights', 'Page views' ],
		[ 'product', 'Product highlights', 'Product views' ],
	] )( 'retitles the highlights and views cards for a %s', ( type, highlights, views ) => {
		const result = withPostTypeTitles( widgetTypes, type );

		expect( result.map( ( { name, title } ) => [ name, title ] ) ).toEqual( [
			[ 'jpa/post-detail-highlights', highlights ],
			[ 'jpa/post-views', views ],
			[ 'jpa/post-likes', 'Post likes' ],
		] );
		expect( result[ 0 ] ).toEqual( { ...widgetTypes[ 0 ], title: highlights } );
	} );

	it.each( [ undefined, 'post' ] )( 'returns the registry untouched for %p', type => {
		expect( withPostTypeTitles( widgetTypes, type ) ).toBe( widgetTypes );
	} );

	it( 'returns the registry untouched when neither card resolved', () => {
		const unrelated = [ widgetTypes[ 2 ] ];

		expect( withPostTypeTitles( unrelated, 'page' ) ).toBe( unrelated );
	} );
} );
