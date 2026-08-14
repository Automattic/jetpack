import type { StatsHighlightsRawResponse } from '../highlights';

export const highlightsFixture = {
	past_seven_days: {
		range: {
			start: '2026-06-15',
			end: '2026-06-21',
		},
		comments: '2',
		likes: 5,
		views: '106',
		visitors: 28,
	},
	between_past_eight_and_fifteen_days: {
		range: {
			start: '2026-06-07',
			end: '2026-06-14',
		},
		comments: 0,
		likes: '1',
		views: 23,
		visitors: '17',
	},
	past_thirty_days: {
		range: {
			start: '2026-05-23',
			end: '2026-06-21',
		},
		comments: '3',
		likes: '6',
		views: '10001',
		visitors: '220',
	},
} satisfies StatsHighlightsRawResponse;
