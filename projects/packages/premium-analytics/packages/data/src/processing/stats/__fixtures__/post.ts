import type { StatsPostRawResponse } from '../post';

export const postStatsFixture: StatsPostRawResponse = {
	date: '2026-06-22',
	views: 128,
	like_count: 24,
	years: {
		'2026': {
			total: 128,
			months: {
				'1': 0,
				'2': 0,
				'3': 0,
				'4': 0,
				'5': 43,
				'6': 85,
			},
		},
	},
	averages: {
		'2026': {
			overall: 4.13,
			months: {
				'5': 1.39,
				'6': 3.86,
			},
		},
	},
	weeks: [
		{
			days: [
				{ day: '2026-06-15', count: 12 },
				{ day: '2026-06-16', count: 0 },
				{ day: '2026-06-17', count: 8 },
				{ day: '2026-06-18', count: 14 },
				{ day: '2026-06-19', count: 16 },
				{ day: '2026-06-20', count: 11 },
				{ day: '2026-06-21', count: 24 },
			],
			total: 85,
			average: 12.14,
			change: 15.25,
		},
	],
	highest_month: 85,
	highest_day_average: 12.14,
	highest_week_average: 85,
	post: {
		ID: 41,
		post_title: 'Hello world',
		post_type: 'post',
		post_date: '2026-06-22 10:00:00',
		post_date_gmt: '2026-06-22 18:00:00',
		post_status: 'publish',
		comment_count: 8,
	},
};

export const postStatsViewsFixture: StatsPostRawResponse = {
	views: 128,
};
