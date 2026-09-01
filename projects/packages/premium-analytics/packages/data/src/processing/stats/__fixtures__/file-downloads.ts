export const fileDownloadsFixture = {
	date: '2026-06-22',
	period: 'day',
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
			other_downloads: 1,
			total_downloads: 6,
		},
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
