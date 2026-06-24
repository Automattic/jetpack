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

export const archivesSummaryFixture = {
	date: '2025-06-02',
	period: 'day',
	summary: {
		search: [
			{
				href: 'http://jetpack.com/?s=',
				value: '',
				views: 4,
			},
			{
				href: 'http://jetpack.com/?s=I+can',
				value: 'I can',
				views: 2,
			},
			{
				href: 'http://jetpack.com/?s=plugin',
				value: 'plugin',
				views: 1,
			},
		],
		cat: [
			{
				href: 'http://jetpack.com/category/rrr/',
				value: 'rrr',
				views: 51,
			},
		],
		home: [
			{
				href: 'http://jetpack.com/',
				value: 1,
				views: 89,
			},
		],
		tax: {
			topics: [
				{
					href: 'http://jetpack.com/?taxonomy=topics&term=aaa',
					value: 'aaa',
					views: 6,
				},
				{
					href: 'http://jetpack.com/?taxonomy=topics&term=bbb',
					value: 'bbb',
					views: 4,
				},
			],
		},
		date: [
			{
				href: 'http://jetpack.com/2024/05',
				value: '2024/05',
				views: 4,
			},
			{
				href: 'http://jetpack.com/2023/06',
				value: '2023/06',
				views: 3,
			},
		],
	},
};
