/**
 * Raw `subscribers/counts` response (pre-sanitizer shape), populated so the
 * Subscriber highlights widget renders every metric tile in Storybook. The
 * endpoint reports current totals for the whole site and has no comparison
 * period, so the values are a single snapshot.
 */
export const mockStatsSubscribersCountsData = {
	counts: {
		total_subscribers: 12840,
		email_subscribers: 9320,
		paid_subscribers: 1180,
		social_followers: 2340,
	},
};
