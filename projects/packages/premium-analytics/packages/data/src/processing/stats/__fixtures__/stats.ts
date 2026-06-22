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
	date: '2026-06-22',
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
				views: 4157,
				video_play: false,
			},
			{
				id: 0,
				href: 'https://example.com/',
				date: null,
				title: 'Home page / Archives',
				type: 'homepage',
				status: null,
				public: false,
				views: 1378,
				video_play: false,
			},
		],
		total_views: 0,
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
	date: '2026-06-22',
	period: 'day',
	summary: {
		groups: [
			{
				group: 'Search Engines',
				name: 'Search Engines',
				icon: 'https://example.com/search-engine.png',
				total: 4801,
				follow_data: null,
				results: [
					{
						name: 'Google Search',
						icon: 'https://example.com/google.png',
						views: 3936,
						children: [
							{
								name: 'google.com',
								url: 'http://www.google.com/',
								icon: null,
								views: 3920,
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
		total_views: 8474,
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
	date: '2026-06-22',
	period: 'day',
	summary: {
		clicks: [
			{
				icon: 'https://example.com/blavatar.png',
				url: null,
				name: 'wordpress.org',
				views: 413,
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
		total_clicks: 1323,
		other_clicks: '0',
	},
};

export const searchTermsSummaryFixture = {
	date: '2026-06-22',
	period: 'day',
	summary: {
		search_terms: [
			{ term: 'delete revisions for wordpress', views: 1 },
			{ term: 'ending quote for how to make monday appealing', views: 1 },
			{ term: 'how do i turn off "your connection to this site is not secure"?', views: 1 },
		],
		total_search_terms: 0,
		encrypted_search_terms: 31,
		other_search_terms: -34,
	},
};

export const fileDownloadsSummaryFixture = {
	date: '2026-06-22',
	period: 'day',
	days: {
		'2026-06-22': {
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
	},
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
	'country-info': {
		US: {
			country_full: 'United States',
			map_region: '021',
		},
		HK: {
			country_full: 'Hong Kong SAR China',
			map_region: '030',
		},
		HU: {
			country_full: 'Hungary',
			map_region: '151',
		},
		CI: {
			country_full: 'Côte d’Ivoire',
			map_region: '002',
		},
	},
	summary: {
		views: [
			{
				location: 'New Jersey',
				views: 2979,
				country_code: 'US',
			},
			{
				location: 'Hong Kong',
				views: 1252,
				country_code: 'HK',
			},
			{
				location: 'Hungary',
				views: 59,
				country_code: 'HU',
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

export const locationsCitySummaryFixture = {
	date: '2026-06-22',
	period: 'day',
	'country-info': {
		US: {
			country_full: 'United States',
			map_region: '021',
		},
		HK: {
			country_full: 'Hong Kong SAR China',
			map_region: '030',
		},
		GB: {
			country_full: 'United Kingdom',
			map_region: '154',
		},
	},
	summary: {
		views: [
			{
				location: 'North Bergen',
				views: 2716,
				country_code: 'US',
				coordinates: {
					latitude: '40.804077',
					longitude: '-74.012366',
				},
			},
			{
				location: 'Hong Kong',
				views: 1246,
				country_code: 'HK',
				coordinates: {
					latitude: '22.28552',
					longitude: '114.15769',
				},
			},
			{
				location: 'London',
				views: 476,
				country_code: 'GB',
				coordinates: {
					latitude: '51.50853',
					longitude: '-0.12574',
				},
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
	date: '2026-06-22',
	period: 'day',
	days: {
		summary: {
			data: [
				{
					post_id: 12,
					title: 'Launch video',
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
	},
};
