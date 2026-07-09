export const utmFixture = {
	top_utm_values: {
		'["google","cpc"]': 11,
		'["newsletter","email"]': '24',
	},
};

export const utmWithTopPostsFixture = {
	top_utm_values: {
		'["spring-sale","newsletter","email"]': 18,
		direct: 7,
	},
	top_posts: {
		'["spring-sale","newsletter","email"]': [
			{
				id: 41,
				title: 'Spring sale landing page',
				views: 12,
				href: 'https://example.com/spring-sale/',
			},
		],
	},
};
