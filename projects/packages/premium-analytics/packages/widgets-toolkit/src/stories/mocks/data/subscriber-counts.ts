/**
 * Paid subscribers on the mocked site when a story asks for a paid one.
 */
export const MOCK_PAID_SUBSCRIBERS = 1180;

/**
 * Raw `subscribers/counts` response (pre-sanitizer shape) from today's mocked totals, so it agrees with the `stats/subscribers` series.
 *
 * @param today             - Today's mocked totals.
 * @param today.subscribers - Email and WordPress.com subscribers.
 * @param today.paid        - Paid subscribers.
 * @return The counts response.
 */
export function buildStatsSubscribersCountsData( today: { subscribers: number; paid: number } ) {
	return {
		counts: {
			total_subscribers: today.subscribers,
			email_subscribers: Math.round( today.subscribers * 0.73 ),
			paid_subscribers: today.paid,
			social_followers: 2340,
		},
	};
}
