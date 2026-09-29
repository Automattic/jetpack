import { sanitizeStatsPostCommentsResponse } from '..';

describe( 'sanitizeStatsPostCommentsResponse', () => {
	it( 'normalizes comments and drops malformed rows', () => {
		expect(
			sanitizeStatsPostCommentsResponse( {
				found: '23',
				comments: [
					{
						ID: 101,
						author: {
							name: ' Olivia Park ',
							login: 'oliviapark',
							avatar_URL: 'https://gravatar.com/avatar/1',
						},
						date: '2026-07-15T01:45:00+00:00',
						URL: 'https://example.com/post/#comment-101',
					},
					{ ID: '102', author: { name: '', login: 'hiroshit' } },
					{ ID: 103, author: {} },
					{ author: { name: 'No id' } },
					'not-a-comment',
				],
			} )
		).toEqual( {
			found: 23,
			comments: [
				{
					ID: 101,
					name: 'Olivia Park',
					avatar_URL: 'https://gravatar.com/avatar/1',
					date: '2026-07-15T01:45:00+00:00',
					URL: 'https://example.com/post/#comment-101',
				},
				{ ID: 102, name: 'hiroshit' },
			],
		} );
	} );

	it( 'returns an empty result for missing or invalid payloads', () => {
		expect( sanitizeStatsPostCommentsResponse( null ) ).toEqual( {
			found: null,
			comments: [],
		} );
		expect( sanitizeStatsPostCommentsResponse( [] ) ).toEqual( {
			found: null,
			comments: [],
		} );
	} );

	it( 'reads a -1 or missing total as unknown, not as a count', () => {
		expect( sanitizeStatsPostCommentsResponse( { found: -1, comments: [] } ).found ).toBeNull();
		expect( sanitizeStatsPostCommentsResponse( { found: '-1', comments: [] } ).found ).toBeNull();
		expect( sanitizeStatsPostCommentsResponse( { comments: [] } ).found ).toBeNull();
	} );

	it( 'keeps a real total of zero', () => {
		expect( sanitizeStatsPostCommentsResponse( { found: 0, comments: [] } ).found ).toBe( 0 );
	} );
} );
