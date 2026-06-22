export const topPostsFixture = {
	summary: {
		total_views: '184',
	},
	days: {
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
	summary: {
		total_views: '312',
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
