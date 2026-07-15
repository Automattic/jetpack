import { sanitizeStatsPostLikesResponse } from '..';

describe( 'sanitizeStatsPostLikesResponse', () => {
	it( 'normalizes the likers and drops malformed rows', () => {
		expect(
			sanitizeStatsPostLikesResponse( {
				found: '30',
				likes: [
					{
						ID: 101,
						name: ' Olivia Park ',
						login: ' oliviapark ',
						avatar_URL: 'https://gravatar.com/avatar/1',
						date_liked: '2026-07-14 15:50:49',
					},
					{ ID: '102', name: 'Hiroshi Tanaka', login: 'hiroshit' },
					{ ID: 103 },
					{ ID: 104, name: '   ', login: '   ' },
					{ name: 'No id' },
					'not-a-liker',
				],
			} )
		).toEqual( {
			found: 30,
			likes: [
				{
					ID: 101,
					name: 'Olivia Park',
					login: 'oliviapark',
					avatar_URL: 'https://gravatar.com/avatar/1',
					// The plain UTC `date_liked` is normalized to ISO 8601.
					date_liked: '2026-07-14T15:50:49Z',
				},
				{ ID: 102, name: 'Hiroshi Tanaka', login: 'hiroshit' },
			],
		} );
	} );

	it( 'returns an empty result for missing or invalid payloads', () => {
		expect( sanitizeStatsPostLikesResponse( null ) ).toEqual( { found: 0, likes: [] } );
		expect( sanitizeStatsPostLikesResponse( [] ) ).toEqual( { found: 0, likes: [] } );
	} );
} );
