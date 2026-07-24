import type {
	StatsSubscribersCountsRawResponse,
	StatsSubscribersRawResponse,
} from '../subscribers';

export const subscribersFixture = {
	date: '2026-06-25',
	unit: 'day',
	fields: [ 'period', 'subscribers', 'subscribers_paid' ],
	data: [
		[ '2026-06-24', '10', '2' ],
		[ '2026-06-25', 12, 3 ],
	],
} satisfies StatsSubscribersRawResponse;

export const subscribersCountsFixture = {
	counts: {
		total_subscribers: 42,
		email_subscribers: 31,
		paid_subscribers: 5,
		social_followers: 9,
	},
} satisfies StatsSubscribersCountsRawResponse;

export const emptySubscribersCountsFixture = {} satisfies StatsSubscribersCountsRawResponse;
