export const topPostsFixture = {
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
