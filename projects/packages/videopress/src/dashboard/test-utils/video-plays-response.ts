/**
 * One day of `stats/video-plays`: Alpha leads by views, Beta by watch time.
 */
export const VIDEO_PLAYS_RESPONSE = {
	days: {
		'2026-06-07': {
			total: { views: 15, impressions: 100, watch_time: 4 },
			data: [
				{ post_id: 1, title: 'Alpha', views: 10, impressions: 60, watch_time: 1 },
				{ post_id: 2, title: 'Beta', views: 5, impressions: 40, watch_time: 3 },
			],
		},
	},
};

/**
 * Report params of the week that ends on the day of the response.
 */
export const VIDEO_PLAYS_REPORT_PARAMS = {
	from: '2026-06-01T00:00:00',
	to: '2026-06-07T23:59:59',
};
