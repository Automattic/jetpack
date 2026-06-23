export const topPostsFixture = {
	date: '2026-06-22',
	period: 'day',
	days: {
		'2026-06-15': {
			postviews: [
				{
					id: 40,
					href: 'https://example.com/previous/',
					date: '2026-06-15 12:00:00',
					title: 'Previous day',
					type: 'post',
					status: 'publish',
					public: true,
					views: 32,
					video_play: false,
				},
			],
			total_views: '128',
			dropped_ids: [],
			other_views: 96,
		},
		'2026-06-16': {
			postviews: [
				{
					id: 41,
					href: 'https://example.com/hello/',
					date: '2026-06-16 12:00:00',
					title: 'Hello world',
					type: 'post',
					status: 'publish',
					public: true,
					views: 64,
					video_play: false,
				},
			],
			total_views: '184',
			dropped_ids: [],
			other_views: 120,
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
