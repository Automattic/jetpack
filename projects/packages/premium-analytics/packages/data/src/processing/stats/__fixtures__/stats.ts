export const topPostsFixture = {
	summary: {
		total_views: '184',
	},
	days: {
		'2026-06-15': {
			total_views: 128,
			postviews: [
				{
					id: 40,
					href: 'https://example.com/previous/',
					title: 'Previous day',
					type: 'post',
					views: 32,
				},
			],
		},
		'2026-06-16': {
			total_views: 184,
			postviews: [
				{
					id: 41,
					href: 'https://example.com/hello/',
					title: 'Hello world',
					type: 'post',
					views: 64,
				},
			],
		},
	},
};

export const topPostsSummaryFixture = {
	date: '2026-06-30',
	period: 'day',
	summary: {
		postviews: [
			{
				id: 265143,
				href: 'https://example.com/home-2/',
				date: '2024-04-24 10:18:11',
				title: 'Homepage',
				type: 'page',
				status: 'publish',
				public: true,
				views: 4148,
				children: [
					{
						title: 'Homepage child attachment',
						link: 'https://example.com/attachment/',
						views: 1,
						type: 'attachment',
					},
				],
				video_play: false,
			},
			{
				id: 242307,
				href: 'https://example.com/upgrade/backup/',
				date: '2024-05-06 15:02:37',
				title: 'Jetpack Backup',
				type: 'page',
				status: 'publish',
				public: true,
				views: 1263,
				video_play: false,
			},
		],
		total_views: '5411',
		dropped_ids: [],
	},
};

export const referrersFixture = {
	days: {
		'2026-06-16': {
			groups: [
				{
					name: 'example.com',
					total: 12,
					results: [ { name: 'example.com/path', views: 12, url: 'https://example.com/path' } ],
				},
			],
		},
	},
};

export const referrersSummaryFixture = {
	date: '2026-06-30',
	period: 'day',
	summary: {
		groups: [
			{
				group: 'Search Engines',
				name: 'Search Engines',
				icon: 'https://example.com/search-engine.png',
				total: 4786,
				follow_data: null,
				results: [
					{
						name: 'Google Search',
						icon: 'https://example.com/google.png',
						views: 3924,
						children: [
							{
								name: 'google.com',
								url: 'http://www.google.com/',
								icon: null,
								views: 3908,
							},
							{
								name: 'google.com.hk',
								url: 'http://www.google.com.hk',
								icon: 'https://example.com/google-hk.png',
								views: 5,
							},
						],
					},
					{
						name: 'Bing',
						icon: 'https://example.com/bing.png',
						views: 542,
						children: [
							{
								name: 'bing.com',
								url: 'https://www.bing.com/',
								icon: 'https://example.com/bing-domain.png',
								views: 523,
							},
							{
								name: 'cn.bing.com',
								url: 'https://cn.bing.com/',
								icon: null,
								views: 2,
							},
						],
					},
				],
			},
		],
		total_views: '4786',
		other_views: '0',
	},
};

export const fileDownloadsFixture = {
	days: {
		'2026-06-16': {
			files: [
				{
					relative_url: '/download.pdf',
					filename: 'download.pdf',
					download_url: 'https://example.com/download.pdf',
					downloads: '5',
				},
			],
		},
	},
};

export const clicksSummaryFixture = {
	date: '2026-06-30',
	period: 'day',
	summary: {
		clicks: [
			{
				icon: 'https://example.com/blavatar.png',
				url: null,
				name: 'wordpress.org',
				views: 412,
				children: [
					{
						url: 'https://wordpress.org/plugins/jetpack-search',
						name: 'wordpress.org/plugins/jetpack-search',
						views: 100,
					},
					{
						url: 'https://wordpress.org/plugins/jetpack-boost/',
						name: 'wordpress.org/plugins/jetpack-boost/',
						views: 32,
					},
				],
			},
		],
		total_clicks: '412',
		other_clicks: '0',
	},
};

export const searchTermsSummaryFixture = {
	date: '2026-06-30',
	period: 'day',
	summary: {
		search_terms: [
			{ term: 'delete revisions for wordpress', views: 1 },
			{ term: 'ending quote for how to make monday appealing', views: 1 },
			{ term: 'how do i turn off "your connection to this site is not secure"?', views: 1 },
		],
		total_search_terms: 0,
		encrypted_search_terms: 30,
		other_search_terms: -33,
	},
};

export const fileDownloadsSummaryFixture = {
	date: '2026-06-30',
	period: 'day',
	summary: {
		files: [
			{
				relative_url: '/guide.pdf',
				filename: 'guide.pdf',
				download_url: 'https://example.com/guide.pdf',
				downloads: '8',
			},
		],
		total_downloads: '8',
		other_downloads: '0',
	},
};

export const topAuthorsSummaryFixture = {
	date: '2026-06-30',
	period: 'day',
	summary: {
		authors: [
			{
				name: 'Jetpack Team',
				avatar: 'https://example.com/avatar.png',
				views: 4160,
				posts: [
					{
						id: 265143,
						title: 'Homepage',
						url: 'https://example.com/?p=265143',
						views: 4151,
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
		total_views: '4160',
	},
};

export const locationsFixture = {
	days: {
		'2026-06-16': {
			views: [
				{
					country_code: 'CI',
					views: '7',
				},
				{
					country_code: 'A1',
					views: '3',
				},
			],
		},
	},
	'country-info': {
		CI: {
			country_full: 'Côte d’Ivoire’s',
			map_region: '002',
		},
	},
};

export const locationsSummaryFixture = {
	date: '2026-06-22',
	period: 'day',
	summary: {
		views: [
			{
				location: 'Hungary',
				views: 59,
				country_code: 'HU',
			},
			{
				location: 'Trinidad & Tobago',
				views: 33,
				country_code: 'TT',
			},
			{
				location: 'Côte d’Ivoire',
				views: 2,
				country_code: 'CI',
			},
		],
		other_views: 0,
		total_views: 0,
	},
};

export const videoPlaysFixture = {
	days: {
		'2026-06-16': {
			plays: [
				{
					post_id: 12,
					title: 'Launch video',
					url: 'https://example.com/video/',
					plays: '11',
				},
			],
		},
	},
};

export const videoPlaysSummaryFixture = {
	date: '2026-06-30',
	period: 'day',
	summary: {
		data: [
			{
				post_id: 12,
				title: 'Launch video',
				url: 'https://example.com/video/',
				views: '11',
				impressions: '42',
				watch_time: '128.5',
				retention_rate: '61.25',
			},
		],
		total: {
			views: '11',
			impressions: '42',
			watch_time: '128.5',
		},
	},
};
