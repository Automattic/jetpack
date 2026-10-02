/**
 * Internal dependencies
 */
import { sanitizeAuthorPostsResponse, sanitizeAuthorSummaryResponse } from '../index';

const user = {
	id: 7,
	name: 'Priya &amp; Co',
	avatar_urls: { '24': 'https://g/24', '48': 'https://g/48', '96': 'https://g/96' },
};

describe( 'sanitizeAuthorSummaryResponse', () => {
	it( 'decodes the name and picks the largest avatar', () => {
		expect( sanitizeAuthorSummaryResponse( user ) ).toEqual( {
			id: 7,
			name: 'Priya & Co',
			avatarUrl: 'https://g/96',
		} );
	} );

	it( 'falls back to a smaller avatar', () => {
		expect(
			sanitizeAuthorSummaryResponse( {
				id: 7,
				name: 'Priya',
				avatar_urls: { '48': 'https://g/48' },
			} )
		).toEqual( { id: 7, name: 'Priya', avatarUrl: 'https://g/48' } );
	} );

	it.each( [ undefined, {}, { '96': '' }, { '200': 'https://g/200' } ] )(
		'leaves the avatar null when no preferred size is offered (%j)',
		avatarUrls => {
			expect(
				sanitizeAuthorSummaryResponse( { ...user, avatar_urls: avatarUrls } )?.avatarUrl
			).toBeNull();
		}
	);

	it.each( [ null, {}, { id: 0 } ] )( 'returns null for a non-user record (%j)', record => {
		expect( sanitizeAuthorSummaryResponse( record ) ).toBeNull();
	} );
} );

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
