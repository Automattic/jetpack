import { sanitizeStatsCommentsResponse } from '..';
import { commentsFixture } from '../__fixtures__/comments';

describe( 'Stats comments normalizer', () => {
	it( 'normalizes comments into author and post groups', () => {
		const result = sanitizeStatsCommentsResponse( commentsFixture );

		expect( result.summary ).toEqual( {
			date: '2026-06-16',
			total_comments: 22,
			monthly_comments: 120,
			most_active_day: 'Monday',
			most_active_time: '17:00',
			most_commented_post: commentsFixture.most_commented_post,
		} );
		expect( result.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-06-16',
				date_start: '2026-06-16T00:00:00+00:00',
				date_end: '2026-06-16T23:59:59+00:00',
				items: [
					{
						label: 'authors',
						value: 12,
						children: [
							{
								label: 'John',
								value: 12,
								iconClassName: 'avatar-user',
								icon: 'https://secure.gravatar.com/avatar/5a83891a81b057fed56930a6aaaf7b3c?d=mm',
								link: null,
								className: 'module-content-list-item-large',
								actions: [ { type: 'follow', data: false } ],
								children: null,
							},
						],
					},
					{
						label: 'posts',
						value: 10,
						children: [
							{
								id: 41,
								label: 'Hello world',
								value: 10,
								link: 'https://example.com/hello/',
								page: '/stats/post/41',
								actions: [ { type: 'link', data: 'https://example.com/hello/' } ],
								children: null,
							},
						],
					},
				],
			} ),
		] );
	} );

	it( 'preserves follow params when present', () => {
		const result = sanitizeStatsCommentsResponse( {
			authors: [
				{
					name: 'Jane',
					comments: 3,
					follow_data: { params: { blog_id: 123, user_id: 456 } },
				},
			],
		} );

		expect( result.data[ 0 ].items ).toEqual( [
			{
				label: 'authors',
				value: 3,
				children: [
					expect.objectContaining( {
						actions: [ { type: 'follow', data: { blog_id: 123, user_id: 456 } } ],
						icon: null,
						link: null,
					} ),
				],
			},
		] );
	} );

	it( 'returns an empty report for missing comment groups', () => {
		expect( sanitizeStatsCommentsResponse( undefined ) ).toEqual( {
			summary: {},
			data: [],
		} );
		expect(
			sanitizeStatsCommentsResponse( {
				total_comments: 0,
			} )
		).toEqual( {
			summary: { total_comments: 0 },
			data: [],
		} );
	} );
} );
