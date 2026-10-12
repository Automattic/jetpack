/**
 * Internal dependencies
 */
import { sanitizeAuthorPostsResponse } from '../index';

describe( 'sanitizeAuthorPostsResponse', () => {
	it( 'reads the oldest post date and the posts total', () => {
		expect(
			sanitizeAuthorPostsResponse( [ { id: 3, date: '2023-07-04T10:00:00' } ], '12' )
		).toEqual( { postCount: 12, firstPublishedDate: '2023-07-04T10:00:00' } );
	} );

	it.each( [
		[ [], null ],
		[ undefined, '-1' ],
		[ [ { id: 3 } ], 'many' ],
	] )( 'falls back to no posts (%j, %p)', ( posts, total ) => {
		expect( sanitizeAuthorPostsResponse( posts, total ) ).toEqual( {
			postCount: 0,
			firstPublishedDate: null,
		} );
	} );
} );
