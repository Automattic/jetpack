export const referrersFixture = {
	date: '2026-06-22',
	period: 'day',
	days: {
		'2026-06-16': {
			groups: [
				{
					group: 'example.com',
					name: 'example.com',
					icon: 'https://example.com/blavatar.png',
					total: 12,
					follow_data: null,
					results: [ { name: 'example.com/path', views: 12, url: 'https://example.com/path' } ],
				},
			],
			other_views: 4,
			total_views: 16,
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
