import type { StatsLatestPostRawItem } from '../latest-post';

export const latestPostFixture: StatsLatestPostRawItem[] = [
	{
		id: 779,
		title: { rendered: 'Hello world' },
		link: 'https://example.com/2026/06/22/hello-world/',
		date: '2026-06-22T10:00:00',
	},
];

export const latestPostEmptyFixture: StatsLatestPostRawItem[] = [];
