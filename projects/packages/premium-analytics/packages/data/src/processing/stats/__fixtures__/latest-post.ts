import type { StatsLatestPostRawResponse } from '../latest-post';

export const latestPostFixture: StatsLatestPostRawResponse = {
	found: 12,
	posts: [
		{
			ID: 779,
			title: 'Hello world',
			URL: 'https://example.com/2026/06/22/hello-world/',
			date: '2026-06-22T10:00:00+00:00',
			like_count: 24,
			discussion: {
				comment_count: 8,
			},
		},
	],
};

export const latestPostEmptyFixture: StatsLatestPostRawResponse = {
	found: 0,
	posts: [],
};
