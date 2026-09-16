/**
 * Internal dependencies
 */
import { sanitizeAuthorSummaryResponse } from '../index';

const user = {
	id: 7,
	name: 'Priya &amp; Co',
	avatar_urls: { '24': 'https://g/24', '48': 'https://g/48', '96': 'https://g/96' },
};

describe( 'sanitizeAuthorSummaryResponse', () => {
	it( 'combines the user, the oldest post date, and the posts total', () => {
		expect(
			sanitizeAuthorSummaryResponse( user, [ { id: 3, date: '2023-07-04T10:00:00' } ], '12' )
		).toEqual( {
			id: 7,
			name: 'Priya & Co',
			avatarUrl: 'https://g/96',
			postCount: 12,
			firstPublishedDate: '2023-07-04T10:00:00',
		} );
	} );

	it( 'falls back to a smaller avatar and to no posts', () => {
		expect(
			sanitizeAuthorSummaryResponse(
				{ id: 7, name: 'Priya', avatar_urls: { '48': 'https://g/48' } },
				[],
				null
			)
		).toEqual( {
			id: 7,
			name: 'Priya',
			avatarUrl: 'https://g/48',
			postCount: 0,
			firstPublishedDate: '',
		} );
	} );

	it.each( [ undefined, {}, { '96': '' }, { '200': 'https://g/200' } ] )(
		'leaves the avatar empty when no preferred size is offered (%j)',
		avatarUrls => {
			expect(
				sanitizeAuthorSummaryResponse( { ...user, avatar_urls: avatarUrls }, [], 0 )?.avatarUrl
			).toBe( '' );
		}
	);

	it.each( [ null, { id: 0 }, { id: '1.5' } ] )(
		'returns null for a non-user record (%j)',
		record => {
			expect( sanitizeAuthorSummaryResponse( record, [], 0 ) ).toBeNull();
		}
	);

	it( 'ignores a negative or fractional total', () => {
		expect( sanitizeAuthorSummaryResponse( user, [], '-3' )?.postCount ).toBe( 0 );
		expect( sanitizeAuthorSummaryResponse( user, [], '2.5' )?.postCount ).toBe( 0 );
	} );
} );
