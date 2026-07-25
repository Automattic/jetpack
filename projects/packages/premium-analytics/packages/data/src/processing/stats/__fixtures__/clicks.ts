export const clicksFixture = {
	date: '2026-06-22',
	period: 'day',
	days: {
		'2026-06-16': {
			clicks: [
				{
					icon: 'https://example.com/blavatar.png',
					url: null,
					name: 'wordpress.org',
					views: 12,
					children: [
						{
							url: 'https://wordpress.org/plugins/jetpack-search',
							name: 'wordpress.org/plugins/jetpack-search',
							views: 8,
						},
					],
				},
			],
			other_clicks: 2,
			total_clicks: 14,
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
