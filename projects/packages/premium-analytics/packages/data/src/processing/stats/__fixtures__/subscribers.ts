import type { StatsSubscribersCountsRawResponse } from '../subscribers';

export const subscribersCountsFixture = {
	counts: {
		total_subscribers: 42,
		email_subscribers: 31,
		paid_subscribers: 5,
		social_followers: 9,
	},
} satisfies StatsSubscribersCountsRawResponse;

export const emptySubscribersCountsFixture = {} satisfies StatsSubscribersCountsRawResponse;
