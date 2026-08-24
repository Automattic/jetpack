import type { StatsWordAdsRawResponse } from '../wordads';

export const wordAdsStatsFixture = {
	unit: 'month',
	fields: [ 'period', 'impressions', 'revenue', 'cpm' ],
	data: [
		[ '2026-05', '1200', '6.50', '5.42' ],
		[ '2026-06', 800, 3.25, 4.06 ],
	],
} satisfies StatsWordAdsRawResponse;

export const wordAdsStatsEmptyFixture = {
	unit: 'day',
	fields: [ 'period', 'impressions', 'revenue', 'cpm' ],
	data: [],
} satisfies StatsWordAdsRawResponse;

export const wordAdsEarningsFixture = {
	earnings: {
		total_earnings: '25.75',
		total_amount_owed: '7.25',
		wordads: {
			'2026-05': {
				amount: '6.50',
				pageviews: '1200',
				status: 1,
			},
			'2026-06': {
				amount: 3.25,
				pageviews: 800,
				status: '0',
			},
		},
		sponsored: {
			'2026-06': {
				amount: '16.00',
				pageviews: '450',
				status: 3,
			},
		},
		adjustment: {
			'2026-06': {
				amount: '0',
				pageviews: 0,
				status: 4,
			},
		},
	},
};

export const wordAdsEarningsEmptyFixture = {
	earnings: {},
};
