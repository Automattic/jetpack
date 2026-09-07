export const singleVideoFixture = {
	data: [
		[ '2026-06-12', 1 ],
		[ '2026-06-13', '4' ],
		[ '2026-06-14', 0 ],
	],
	pages: [ 'https://example.com/intro-video/', 'https://example.com/2026/06/launch-recap/' ],
	post: {
		ID: 31533,
		post_title: 'Launch recap',
		post_date: '2026-06-12 14:30:00',
		post_mime_type: 'video/mp4',
		poster: 'https://i0.wp.com/videos.files.wordpress.com/abcd1234/launch-recap.jpg',
	},
};

// A `statType=all` range response (wpcom #229903): tuples named by `fields`
// plus canonical totals over the requested window. String cells exercise the
// numeric coercion.
export const singleVideoAllMetricsFixture = {
	fields: [ 'period', 'plays', 'impressions', 'watch_time', 'retention_rate' ],
	data: [
		[ '2026-07-01', 3, 10, 0.5, 25.5 ],
		[ '2026-07-02', '0', 4, 0, 0 ],
	],
	pages: [],
	total: { plays: 3, impressions: 14, watch_time: '0.5', retention_rate: 25.5 },
};

export const singleVideoEmptyFixture = {
	data: [],
	pages: [],
	post: null,
};
