import { sanitizeStatsCommentsResponse, selectStatsCommentsRows } from '..';
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

	it( 'links guest authors to the comments-admin search by email', () => {
		const result = sanitizeStatsCommentsResponse( {
			authors: [
				{
					name: 'Aggie',
					comments: 2,
					link: '?s=aggie@example.com',
					follow_data: null,
				},
			],
		} );

		expect( result.data[ 0 ].items ).toEqual( [
			expect.objectContaining( {
				label: 'authors',
				children: [
					expect.objectContaining( {
						label: 'Aggie',
						// The raw `?s=<email>` fragment is not a URL; it maps to the
						// comment management screen filtered to that author. WPCOM-user
						// rows (`?user_id=<id>`) have no wp-admin equivalent and stay
						// unlinked (covered above).
						link: 'edit-comments.php?s=aggie%40example.com',
					} ),
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

describe( 'selectStatsCommentsRows', () => {
	it( 'flattens the authors group into ranked rows keyed on the gravatar hash', () => {
		const report = sanitizeStatsCommentsResponse( {
			authors: [
				{ name: 'Aggie', comments: 2, link: '?s=aggie@example.com', gravatar: 'g/aggie?s=48' },
				{ name: 'Bo', comments: 7, link: '?user_id=1662656', gravatar: 'g/bo?s=48' },
			],
		} );

		expect( selectStatsCommentsRows( report, 'authors' ) ).toEqual( [
			{
				id: 'g/bo?d=mm',
				label: 'Bo',
				value: 7,
				avatarUrl: 'g/bo?d=mm',
				// WPCOM-user rows have no wp-admin equivalent, so they stay unlinked.
				link: undefined,
			},
			{
				id: 'g/aggie?d=mm',
				label: 'Aggie',
				value: 2,
				avatarUrl: 'g/aggie?d=mm',
				link: 'edit-comments.php?s=aggie%40example.com',
			},
		] );
	} );

	it( 'flattens the posts group and keeps the post id for drill-through', () => {
		const report = sanitizeStatsCommentsResponse( commentsFixture );

		expect( selectStatsCommentsRows( report, 'posts' ) ).toEqual( [
			{
				id: '41',
				label: 'Hello world',
				value: 10,
				link: 'https://example.com/hello/',
				postId: '41',
				avatarUrl: undefined,
			},
		] );
	} );

	// Consumers guard the permalink themselves, so the raw link has to survive
	// here: a post with no id keys its row on it.
	it( 'keeps the raw link as the row id when a post has no id', () => {
		const report = sanitizeStatsCommentsResponse( {
			posts: [ { name: 'Hello world', comments: 3, link: 'javascript:alert(1)' } ],
		} );

		expect( selectStatsCommentsRows( report, 'posts' ) ).toEqual( [
			expect.objectContaining( { id: 'javascript:alert(1)', link: 'javascript:alert(1)' } ),
		] );
	} );

	it( 'trims to maxRows, treating 0 and undefined as all rows', () => {
		const report = sanitizeStatsCommentsResponse( {
			authors: [
				{ name: 'Aggie', comments: 2 },
				{ name: 'Bo', comments: 7 },
				{ name: 'Cy', comments: 5 },
			],
		} );

		expect( selectStatsCommentsRows( report, 'authors', 2 ).map( row => row.label ) ).toEqual( [
			'Bo',
			'Cy',
		] );
		expect( selectStatsCommentsRows( report, 'authors', 0 ) ).toHaveLength( 3 );
		expect( selectStatsCommentsRows( report, 'authors' ) ).toHaveLength( 3 );
	} );

	it( 'returns no rows for an unresolved or empty report', () => {
		expect( selectStatsCommentsRows( undefined, 'authors' ) ).toEqual( [] );
		expect(
			selectStatsCommentsRows( sanitizeStatsCommentsResponse( { authors: [] } ), 'posts' )
		).toEqual( [] );
	} );
} );
