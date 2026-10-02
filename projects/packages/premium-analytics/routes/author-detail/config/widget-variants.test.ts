/**
 * Internal dependencies
 */
import { AUTHOR_DETAIL_WIDGET_TYPE_ALIASES } from './widget-variants';

describe( 'author detail widget type aliases', () => {
	it( 'titles each spotlight without the dashboard’s site-wide window', () => {
		const titles = Object.fromEntries(
			AUTHOR_DETAIL_WIDGET_TYPE_ALIASES.flatMap( ( { variants } ) =>
				variants.map( variant => [ variant.name, variant.getTitle() ] )
			)
		);

		expect( titles ).toEqual( {
			'jpa/popular-post--author': 'Popular post',
			'jpa/latest-post--author': 'Latest post',
		} );
	} );

	it( 'replaces each help note with one scoped to the author', () => {
		const help = Object.fromEntries(
			AUTHOR_DETAIL_WIDGET_TYPE_ALIASES.flatMap( ( { variants } ) =>
				variants.map( variant => [ variant.name, variant.getHelp?.().content ] )
			)
		);

		expect( help ).toEqual( {
			'jpa/popular-post--author':
				'This author’s most-viewed post, with its headline views, likes and comments.',
			'jpa/latest-post--author':
				'This author’s most recently published post, with its headline views, likes and comments.',
		} );
	} );
} );
