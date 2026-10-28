import { sanitizeStatsAuthorResponse } from '../author';

describe( 'sanitizeStatsAuthorResponse', () => {
	it( 'decodes the author name and the entity-encoded avatar URL', () => {
		expect(
			sanitizeStatsAuthorResponse( {
				author: {
					author_id: 7,
					name: 'Priya &amp; Co',
					avatar: 'https://g/a?s=64&amp;d=mm&amp;r=G',
				},
			} ).author
		).toEqual( { id: 7, name: 'Priya & Co', avatarUrl: 'https://g/a?s=64&d=mm&r=G' } );
	} );

	it.each( [ undefined, {}, { author_id: 0, name: 'X' } ] )(
		'is null without a valid author (%j)',
		author => {
			expect( sanitizeStatsAuthorResponse( { author } ).author ).toBeNull();
		}
	);
} );
