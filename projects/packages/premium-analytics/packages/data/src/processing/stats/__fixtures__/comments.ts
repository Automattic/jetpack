export const commentsFixture = {
	date: '2026-06-16',
	total_comments: 22,
	monthly_comments: 120,
	most_active_day: 'Monday',
	most_active_time: '17:00',
	most_commented_post: {
		id: 41,
		name: 'Hello world',
		comments: 10,
		link: 'https://example.com/hello/',
	},
	authors: [
		{
			name: 'John',
			comments: 12,
			link: '?user_id=1662656',
			gravatar: 'https://secure.gravatar.com/avatar/5a83891a81b057fed56930a6aaaf7b3c?s=48',
			follow_data: null,
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
