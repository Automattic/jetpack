export const tagsFixture = {
	date: '2026-06-22',
	period: 'day',
	tags: [
		{
			tags: [
				{
					type: 'category',
					name: 'News',
					link: 'https://example.com/category/news/',
				},
			],
			views: '18',
		},
		{
			tags: [
				{
					type: 'category',
					name: 'Announcements',
					link: 'https://example.com/category/announcements/',
				},
				{
					type: 'tag',
					name: 'Release',
					link: 'https://example.com/tag/release/',
				},
			],
			views: '7',
		},
	],
};

export const tagsByDateFixture = {
	date: '2026-06-22',
	period: 'day',
	days: {
		'2026-06-16': {
			tags: [
				{
					tags: [
						{
							type: 'category',
							name: 'By date',
							link: 'https://example.com/category/by-date/',
						},
					],
					views: 0,
				},
			],
			total_views: 0,
		},
	},
};

export const tagsSummaryFixture = {
	date: '2026-06-22',
	period: 'day',
	summary: {
		tags: [
			{
				tags: [
					{
						type: 'tag',
						name: 'Summary',
						link: 'https://example.com/tag/summary/',
					},
				],
				views: '34',
			},
		],
		total_views: '34',
	},
};
