export const topAuthorsFixture = {
	date: '2026-06-22',
	period: 'day',
	days: {
		'2026-06-16': {
			authors: [
				{
					name: 'Jetpack Team',
					avatar: 'https://example.com/avatar.png',
					views: 64,
					posts: [
						{
							id: 265143,
							title: 'Homepage',
							url: 'https://example.com/?p=265143',
							views: 60,
							video: false,
						},
					],
					follow_data: {
						params: {
							'stat-source': 'stats_author',
							'follow-text': 'Follow',
							'following-text': 'Following',
							'following-hover-text': 'Unfollow',
							blog_domain: 'example.com',
							blog_url: 'https://example.com',
							blog_id: 20115252,
							site_id: 20115252,
							blog_title: 'Jetpack',
							is_following: false,
						},
						type: 'follow',
					},
					author_id: 196411292,
					other_views: 4,
				},
			],
			other_views: 12,
		},
	},
};

export const topAuthorsSummaryFixture = {
	date: '2026-06-22',
	period: 'day',
	summary: {
		authors: [
			{
				name: 'Jetpack Team',
				avatar: 'https://example.com/avatar.png',
				views: 4166,
				posts: [
					{
						id: 265143,
						title: 'Homepage',
						url: 'https://example.com/?p=265143',
						views: 4157,
						video: false,
					},
					{
						id: 345724,
						title: 'What’s new in Jetpack: June 2025 Update',
						url: 'https://example.com/?p=345724',
						views: 3,
						video: false,
					},
				],
				follow_data: {
					params: {
						'stat-source': 'stats_author',
						'follow-text': 'Follow',
						'following-text': 'Following',
						'following-hover-text': 'Unfollow',
						blog_domain: 'example.com',
						blog_url: 'https://example.com',
						blog_id: 20115252,
						site_id: 20115252,
						blog_title: 'Jetpack',
						is_following: false,
					},
					type: 'follow',
				},
				author_id: 196411292,
				other_views: 0,
			},
		],
	},
};
