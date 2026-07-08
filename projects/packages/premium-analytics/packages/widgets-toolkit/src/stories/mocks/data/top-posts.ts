export const mockTopPostsData = {
	date: '2026-06-22',
	period: 'month',
	summary: {
		postviews: [
			{
				id: 101,
				href: 'https://example.com/hello-world/',
				date: '2026-06-01 09:00:00',
				title: 'Hello world!',
				type: 'post',
				status: 'publish',
				public: true,
				views: 173,
			},
			{
				id: 210,
				href: 'https://example.com/post-10/',
				date: '2026-06-02 09:00:00',
				title: 'Post 10',
				type: 'post',
				status: 'publish',
				public: true,
				views: 127,
			},
			{
				id: 209,
				href: 'https://example.com/post-9/',
				date: '2026-06-03 09:00:00',
				title: 'Post 9',
				type: 'post',
				status: 'publish',
				public: true,
				views: 99,
			},
			{
				id: 208,
				href: 'https://example.com/post-8/',
				date: '2026-06-04 09:00:00',
				title: 'Post 8',
				type: 'post',
				status: 'publish',
				public: true,
				views: 73,
			},
			{
				id: 307,
				href: 'https://example.com/pricing/',
				date: '2026-05-15 09:00:00',
				title: 'Pricing',
				type: 'page',
				status: 'publish',
				public: true,
				views: 54,
			},
			{
				id: 0,
				href: 'https://example.com/',
				date: null,
				title: 'Home page / Archives',
				type: 'homepage',
				status: null,
				public: false,
				views: 43,
			},
		],
		total_views: 569,
		dropped_ids: [],
	},
};

export const mockTopPostsComparisonData = {
	date: '2026-05-22',
	period: 'month',
	summary: {
		postviews: [
			{
				id: 101,
				href: 'https://example.com/hello-world/',
				date: '2026-05-01 09:00:00',
				title: 'Hello world!',
				type: 'post',
				status: 'publish',
				public: true,
				views: 159,
			},
			{
				id: 210,
				href: 'https://example.com/post-10/',
				date: '2026-05-02 09:00:00',
				title: 'Post 10',
				type: 'post',
				status: 'publish',
				public: true,
				views: 143,
			},
			{
				id: 209,
				href: 'https://example.com/post-9/',
				date: '2026-05-03 09:00:00',
				title: 'Post 9',
				type: 'post',
				status: 'publish',
				public: true,
				views: 93,
			},
			{
				id: 208,
				href: 'https://example.com/post-8/',
				date: '2026-05-04 09:00:00',
				title: 'Post 8',
				type: 'post',
				status: 'publish',
				public: true,
				views: 82,
			},
			{
				id: 307,
				href: 'https://example.com/pricing/',
				date: '2026-04-15 09:00:00',
				title: 'Pricing',
				type: 'page',
				status: 'publish',
				public: true,
				views: 61,
			},
		],
		total_views: 538,
		dropped_ids: [],
	},
};

export const mockArchivesData = {
	date: '2026-06-22',
	period: 'month',
	summary: {
		cat: [
			{
				href: 'https://example.com/category/releases/',
				value: 'Releases',
				views: 83,
			},
			{
				href: 'https://example.com/category/tutorials/',
				value: 'Tutorials',
				views: 71,
			},
		],
		tax: {
			topics: [
				{
					href: 'https://example.com/topics/performance/',
					value: 'Performance',
					views: 58,
				},
				{
					href: 'https://example.com/topics/security/',
					value: 'Security',
					views: 44,
				},
			],
		},
		date: [
			{
				href: 'https://example.com/2026/06/',
				value: '2026/06',
				views: 36,
			},
		],
		home: [
			{
				href: 'https://example.com/',
				value: 'home',
				views: 29,
			},
		],
	},
};

export const mockArchivesComparisonData = {
	date: '2026-05-22',
	period: 'month',
	summary: {
		cat: [
			{
				href: 'https://example.com/category/releases/',
				value: 'Releases',
				views: 72,
			},
			{
				href: 'https://example.com/category/tutorials/',
				value: 'Tutorials',
				views: 80,
			},
		],
		tax: {
			topics: [
				{
					href: 'https://example.com/topics/performance/',
					value: 'Performance',
					views: 51,
				},
				{
					href: 'https://example.com/topics/security/',
					value: 'Security',
					views: 49,
				},
			],
		},
		date: [
			{
				href: 'https://example.com/2026/05/',
				value: '2026/05',
				views: 42,
			},
		],
		home: [
			{
				href: 'https://example.com/',
				value: 'home',
				views: 32,
			},
		],
	},
};
