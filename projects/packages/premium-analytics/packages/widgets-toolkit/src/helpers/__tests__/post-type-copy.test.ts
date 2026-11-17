import { getPostTypeCopy } from '../post-type-copy';

it.each( [
	[ 'post', 'Post traffic', 'Post highlights', 'Post views' ],
	[ 'page', 'Page traffic', 'Page highlights', 'Page views' ],
	[ 'product', 'Product traffic', 'Product highlights', 'Product views' ],
	[ 'jetpack-portfolio', 'Post traffic', 'Post highlights', 'Post views' ],
	[ undefined, 'Post traffic', 'Post highlights', 'Post views' ],
] )( 'names the %s detail page', ( type, traffic, highlights, views ) => {
	expect( getPostTypeCopy( type ) ).toMatchObject( { traffic, highlights, views } );
} );
