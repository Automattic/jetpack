export const videoPlaysFixture = {
	date: '2026-06-22',
	period: 'day',
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
			other_plays: 0,
			total_plays: 11,
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
