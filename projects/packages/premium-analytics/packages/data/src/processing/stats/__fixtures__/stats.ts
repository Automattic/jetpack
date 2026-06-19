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

export const utmFixture = [
	{
		label: 'google',
		value: 10,
		children: [ { label: 'cpc', value: 6 } ],
	},
];

export const devicesFixture = [
	{
		label: 'Desktop',
		value: '42',
	},
];

export const genericListFixture = [
	{
		name: 'Example tag',
		views: '18',
		value: 'raw-value',
	},
];

export const visitsFixture = {
	unit: 'day',
	fields: [ 'period', 'views', 'visitors', 'likes' ],
	data: [
		[ '2026-06-16', '12', '5', 1 ],
		[ '2026-06-17', '8', '3', 0 ],
	],
};

export const weeklyVisitsFixture = {
	unit: 'week',
	fields: [ 'period', 'views', 'visitors' ],
	data: [ [ '2026-W25', '20', '9' ] ],
};

export const emailOpensTimeSeriesFixture = {
	timeline: {
		fields: [ 'date', 'opens_count' ],
		data: [
			[ '2026-06-16', '7' ],
			[ '2026-06-17', '3' ],
		],
		unit: 'day',
	},
	opens_rate: {
		total_sends: 2,
		unique_opens: 2,
		total_opens: 3,
		opens_rate: 1,
	},
};

export const emailClicksTimeSeriesFixture = {
	timeline: {
		fields: [ 'date', 'clicks_count' ],
		data: [
			[ '2026-06-16', '5' ],
			[ '2026-06-17', '2' ],
		],
		unit: 'day',
	},
};

export const subscribersFixture = {
	unit: 'day',
	fields: [ 'period', 'subscribers', 'subscribers_change' ],
	data: [
		[ '2026-06-16', '14', '2' ],
		[ '2026-06-17', '15', '1' ],
	],
};

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

export const emailSummaryFixture = {
	posts: [
		{
			id: 41,
			href: 'https://example.com/hello/',
			date: '2026-06-16',
			title: 'Hello world',
			type: 'post',
			opens: '7',
			clicks: '3',
			opens_rate: '0.7',
			clicks_rate: '0.3',
			unique_opens: '5',
			unique_clicks: '2',
			total_sends: '10',
		},
	],
};

export const emailOpensBreakdownFixture = {
	clients: {
		fields: [ 'client', 'opens_count' ],
		data: [ [ 'Other', '3' ] ],
	},
};

export const emailClicksCountryBreakdownFixture = {
	countries: {
		fields: [ 'country', 'clicks_count' ],
		data: [ [ 'NZ', '4' ] ],
	},
	'countries-info': {
		NZ: {
			country_full: 'New Zealand',
		},
	},
};

export const singlePostFixture = {
	unit: 'day',
	fields: [ 'period', 'views', 'visitors' ],
	data: [ [ '2026-06-16', '19', '11' ] ],
	post: {
		id: 41,
		title: 'Hello world',
	},
};

export const utmTopValuesFixture = {
	top_utm_values: {
		'["google","cpc"]': 11,
	},
	top_posts: {
		'["google","cpc"]': [
			{
				id: 41,
				title: 'Hello world',
				views: 6,
				href: 'https://example.com/hello/',
			},
		],
	},
};

export const devicesTopValuesFixture = {
	top_values: {
		mobile: 9,
		desktop: 4,
	},
};

export const wordAdsStatsFixture = {
	unit: 'day',
	fields: [ 'period', 'impressions', 'revenue', 'cpm' ],
	data: [
		[ '2026-06-16', '1200', '4.20', '3.50' ],
		[ '2026-06-17', '800', '2.40', '3.00' ],
	],
};
