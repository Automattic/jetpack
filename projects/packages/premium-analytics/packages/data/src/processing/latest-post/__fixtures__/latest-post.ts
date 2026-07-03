import type { LatestPostRawItem } from '..';

export const latestPostFixture: LatestPostRawItem[] = [
	{
		id: 779,
		title: { rendered: 'Hello world' },
		link: 'https://example.com/2026/06/22/hello-world/',
		date: '2026-06-22T10:00:00',
		featured_media: 42,
		_embedded: {
			'wp:featuredmedia': [
				{
					source_url: 'https://example.com/wp-content/uploads/hello-world.jpg',
					alt_text: 'A cheerful greeting',
					media_details: {
						sizes: {
							large: { source_url: 'https://example.com/wp-content/uploads/hello-world-large.jpg' },
							medium_large: {
								source_url: 'https://example.com/wp-content/uploads/hello-world-medium.jpg',
							},
						},
					},
				},
			],
		},
	},
];

export const latestPostEmptyFixture: LatestPostRawItem[] = [];
