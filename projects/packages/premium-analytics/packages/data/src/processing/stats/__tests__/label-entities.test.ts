import {
	sanitizeStatsArchivesResponse,
	sanitizeStatsCommentFollowersResponse,
	sanitizeStatsCommentsResponse,
	sanitizeStatsEmailSummaryResponse,
	sanitizeStatsFollowersResponse,
	sanitizeStatsPostCommentsResponse,
	sanitizeStatsPostLikesResponse,
	sanitizeStatsPostResponse,
	sanitizeStatsSearchTermsResponse,
	sanitizeStatsSingleVideoResponse,
	sanitizeStatsTagsResponse,
	sanitizeStatsTopAuthorsResponse,
	sanitizeStatsTopPostsResponse,
	sanitizeStatsUtmResponse,
	sanitizeStatsVideoPlaysResponse,
} from '..';

const ENCODED = 'Tea &amp; Crumpets&#8217; Best';
const DECODED = 'Tea & Crumpets’ Best';

const DATE = '2026-06-16';
const DAY_QUERY = { period: 'day', end_date: DATE };

function firstLabel( report: { data: Array< { items: Array< { label: unknown } > } > } ): unknown {
	return report.data[ 0 ]?.items[ 0 ]?.label;
}

function firstChildLabel( report: {
	data: Array< { items: Array< { children?: Array< { label: unknown } > | null } > } >;
} ): unknown {
	return report.data[ 0 ]?.items[ 0 ]?.children?.[ 0 ]?.label;
}

/**
 * Every normalizer that carries a user-authored title or name. WPCOM returns
 * these HTML-encoded, so a normalizer missing its decode shows up here rather
 * than on someone's dashboard.
 */
const CASES: Array< [ string, () => unknown ] > = [
	[
		'top posts',
		() =>
			firstLabel(
				sanitizeStatsTopPostsResponse(
					{
						date: DATE,
						period: 'day',
						days: { [ DATE ]: { postviews: [ { id: 1, title: ENCODED, views: 1 } ] } },
					},
					DAY_QUERY
				)
			),
	],
	[
		'top authors',
		() =>
			firstLabel(
				sanitizeStatsTopAuthorsResponse(
					{
						date: DATE,
						period: 'day',
						days: { [ DATE ]: { authors: [ { name: ENCODED, views: 1 } ] } },
					},
					DAY_QUERY
				)
			),
	],
	[
		'top authors posts',
		() =>
			firstChildLabel(
				sanitizeStatsTopAuthorsResponse(
					{
						date: DATE,
						period: 'day',
						days: {
							[ DATE ]: {
								authors: [
									{ name: 'Author', views: 1, posts: [ { id: 1, title: ENCODED, views: 1 } ] },
								],
							},
						},
					},
					DAY_QUERY
				)
			),
	],
	[
		'video plays',
		() =>
			firstLabel(
				sanitizeStatsVideoPlaysResponse(
					{
						date: DATE,
						period: 'day',
						days: { [ DATE ]: { plays: [ { post_id: 1, title: ENCODED, plays: 1 } ] } },
					},
					DAY_QUERY
				)
			),
	],
	[
		'comment followers',
		() =>
			firstLabel(
				sanitizeStatsCommentFollowersResponse(
					{ posts: [ { id: 5, title: ENCODED, followers: 1 } ] },
					DAY_QUERY
				)
			),
	],
	[
		'UTM top posts',
		() =>
			firstChildLabel(
				sanitizeStatsUtmResponse(
					{
						top_utm_values: { '["newsletter"]': 1 },
						top_posts: { '["newsletter"]': [ { id: 1, title: ENCODED, views: 1 } ] },
					},
					{ date: DATE, utm_param: 'utm_source' }
				)
			),
	],
	[
		'comment authors',
		() =>
			firstChildLabel(
				sanitizeStatsCommentsResponse(
					{ date: DATE, authors: [ { name: ENCODED, comments: 1 } ] },
					DAY_QUERY
				)
			),
	],
	[
		'commented posts',
		() =>
			firstChildLabel(
				sanitizeStatsCommentsResponse(
					{ date: DATE, posts: [ { id: 1, name: ENCODED, comments: 1 } ] },
					DAY_QUERY
				)
			),
	],
	[
		'tags',
		() =>
			(
				sanitizeStatsTagsResponse(
					{
						date: DATE,
						period: 'day',
						tags: [ { tags: [ { type: 'tag', name: ENCODED } ], views: 1 } ],
					},
					DAY_QUERY
				).data[ 0 ].items[ 0 ].label as Array< { label: string } >
			 )[ 0 ].label,
	],
	[
		'subscribers',
		() =>
			firstLabel(
				sanitizeStatsFollowersResponse(
					{
						subscribers: [
							{ ID: 1, display_name: ENCODED, date_subscribed: `${ DATE }T00:00:00+00:00` },
						],
					},
					DAY_QUERY
				)
			),
	],
	[
		'archives',
		() =>
			firstChildLabel(
				sanitizeStatsArchivesResponse(
					{
						date: DATE,
						period: 'day',
						days: {
							[ DATE ]: {
								category: [ { value: ENCODED, href: 'https://example.com/c/', views: '2' } ],
							},
						},
					},
					DAY_QUERY
				)
			),
	],
	[
		'search terms',
		() =>
			firstLabel(
				sanitizeStatsSearchTermsResponse(
					{
						date: DATE,
						period: 'day',
						days: { [ DATE ]: { search_terms: [ { term: ENCODED, views: 1 } ] } },
					},
					DAY_QUERY
				)
			),
	],
	[
		'email summary',
		() =>
			firstLabel(
				sanitizeStatsEmailSummaryResponse(
					{ posts: [ { id: 1, title: ENCODED, opens: 1 } ] },
					DAY_QUERY
				)
			),
	],
	[
		'post detail',
		() => sanitizeStatsPostResponse( { post: { ID: 1, post_title: ENCODED } } ).post?.post_title,
	],
	[
		'video detail',
		() => sanitizeStatsSingleVideoResponse( { post: { ID: 1, post_title: ENCODED } } ).post?.title,
	],
	[
		'post comments',
		() =>
			sanitizeStatsPostCommentsResponse( {
				found: 1,
				comments: [ { ID: 1, author: { name: ENCODED } } ],
			} ).comments[ 0 ].name,
	],
	[
		'post likes',
		() =>
			sanitizeStatsPostLikesResponse( { found: 1, likes: [ { ID: 1, name: ENCODED } ] } ).likes[ 0 ]
				.name,
	],
];

describe( 'Stats label HTML entities', () => {
	it.each( CASES )( 'decodes the %s label', ( _name, run ) => {
		expect( run() ).toBe( DECODED );
	} );
} );
