/**
 * Raw `subscribers/counts` response (pre-sanitizer shape). No paid subscribers, so Subscriber highlights shows its 30, 60, and 90 days ago tiles by default.
 */
export const mockStatsSubscribersCountsData = {
	counts: {
		total_subscribers: 12840,
		email_subscribers: 9320,
		paid_subscribers: 0,
		social_followers: 2340,
	},
};

/**
 * The same snapshot for a site with paid subscribers, where Subscriber highlights shows paid, free, and social tiles.
 */
export const mockStatsSubscribersCountsWithPaidData = {
	counts: {
		...mockStatsSubscribersCountsData.counts,
		paid_subscribers: 1180,
	},
};
