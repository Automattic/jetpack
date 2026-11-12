/**
 * Internal dependencies
 */
import { sanitizeAuthorPostsResponse } from '../index';

describe( 'sanitizeAuthorPostsResponse', () => {
	it( 'reads the posts total', () => {
		expect( sanitizeAuthorPostsResponse( '12' ) ).toEqual( { postCount: 12 } );
	} );

	it.each( [ null, undefined, '-1', 'many' ] )( 'falls back to no posts (%p)', total => {
		expect( sanitizeAuthorPostsResponse( total ) ).toEqual( { postCount: 0 } );
	} );
} );
