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
				id: 0,
				href: null,
				date: null,
				title: 'Homepage (Latest posts)',
				type: 'homepage',
				status: null,
				public: false,
				views: 182,
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
				id: 41,
				href: 'https://example.com/hello/',
				date: '2026-06-22 13:54:00',
				title: 'Hello world',
				type: 'post',
				status: 'publish',
				public: true,
				views: 17,
				video_play: false,
			},
		],
		total_views: '312',
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
				name: 'example.com',
				total: 12,
				results: [ { name: 'example.com/path', views: 12, url: 'https://example.com/path' } ],
			},
		],
		total_views: '12',
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
					downloads: '5',
					download_url: 'https://example.com/download.pdf',
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
				name: 'example.com',
				views: '9',
				url: 'https://example.com/',
				children: [
					{
						name: 'example.com/docs',
						views: '4',
						url: 'https://example.com/docs',
					},
				],
			},
		],
		total_clicks: '9',
		other_clicks: '0',
	},
};

export const searchTermsSummaryFixture = {
	date: '2026-06-30',
	period: 'day',
	summary: {
		search_terms: [ { term: 'jetpack stats', views: '14' } ],
		total_search_terms: '14',
		encrypted_search_terms: '0',
		other_search_terms: '0',
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
				downloads: '8',
				download_url: 'https://example.com/guide.pdf',
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
				name: 'Jane Author',
				views: '18',
				avatar: 'https://example.com/avatar.jpg',
				posts: [
					{
						id: 42,
						title: 'Author post',
						views: '12',
						url: 'https://example.com/author-post/',
					},
				],
			},
		],
		total_views: '18',
	},
};

export const locationsFixture = {
	days: {
		'2026-06-16': {
			views: [
				{
					country_code: 'CI',
					views: '7',
					location: 'Côte d’Ivoire’s',
				},
				{
					country_code: 'A1',
					views: '3',
				},
			],
		},
	},
};

export const locationsSummaryFixture = {
	date: '2026-06-30',
	period: 'day',
	summary: {
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
		total_views: '10',
	},
	'country-info': {
		CI: {
			country_full: 'Côte d’Ivoire',
			map_region: '002',
		},
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
					impressions: '42',
					watch_time: '128.5',
					retention_rate: '61.25',
				},
			],
		},
	},
};

export const videoPlaysSummaryFixture = {
	date: '2026-06-30',
	period: 'day',
	summary: {
		plays: [
			{
				post_id: 12,
				title: 'Launch video',
				url: 'https://example.com/video/',
				plays: '11',
				impressions: '42',
				watch_time: '128.5',
				retention_rate: '61.25',
			},
		],
		total_plays: '11',
		other_plays: '0',
	},
};
