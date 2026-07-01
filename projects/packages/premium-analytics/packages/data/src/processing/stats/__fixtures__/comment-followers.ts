import type { StatsCommentFollowersRawResponse } from '../comment-followers';

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
} satisfies StatsCommentFollowersRawResponse;
