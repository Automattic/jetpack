export const devicesFixture = [
	{
		label: 'Desktop',
		value: '42',
	},
];

export const devicesTopValuesFixture = {
	top_values: {
		mobile: 9,
		desktop: 4,
	},
};

export const genericListFixture = [
	{
		name: 'Example tag',
		views: '18',
		value: 'raw-value',
	},
];

export const publicizeFixture = {
	services: [
		{
			service: 'mastodon',
			followers: '12',
		},
	],
};

export const followersFixture = {
	page: 1,
	pages: 1,
	total: 125,
	total_email: 5,
	total_wpcom: 120,
	subscribers: [
		{
			ID: 111,
			label: 'reader@example.com',
			url: null,
			date_subscribed: '2026-06-16T18:53:05+00:00',
		},
	],
};

export const tagsFixture = {
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
	],
};

export const commentsFixture = {
	total_comments: 22,
	most_active_day: 'Monday',
	most_active_time: '17:00',
	authors: [
		{
			name: 'Jane',
			comments: '12',
			gravatar: 'https://example.com/avatar.jpg',
		},
	],
	posts: [
		{
			id: 41,
			name: 'Hello world',
			comments: '10',
			link: 'https://example.com/hello/',
		},
	],
};

export const commentFollowersFixture = {
	page: 1,
	pages: 1,
	total: 2,
	posts: [
		{
			id: 0,
			title: 'All Posts',
			followers: 20,
		},
		{
			id: 41,
			title: 'Hello world',
			followers: '10',
			url: 'https://example.com/hello/',
		},
	],
};

export const archivesFixture = {
	days: {
		'2026-06-16': {
			home: [
				{
					value: 'home',
					href: 'https://example.com/',
					views: '3',
				},
			],
			post_type: [
				{
					value: 'post',
					href: 'https://example.com/type/post/',
					views: '4',
				},
				{
					value: 'page',
					href: 'https://example.com/type/page/',
					views: '0',
				},
			],
			tax: {
				category: [
					{
						value: 'News%20%26%20Updates',
						href: 'https://example.com/category/news/',
						views: '8',
					},
				],
			},
		},
	},
};
