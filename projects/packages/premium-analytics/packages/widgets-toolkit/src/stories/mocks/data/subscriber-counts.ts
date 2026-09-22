/**
 * Paid subscribers on the mocked site when a story asks for a paid one.
 */
export const MOCK_PAID_SUBSCRIBERS = 1180;

/**
 * Raw `subscribers/counts` response (pre-sanitizer shape) for a site with `paidSubscribers` of them.
 *
 * @param paidSubscribers - Paid subscribers the mocked site has.
 * @return The counts response.
 */
export function buildStatsSubscribersCountsData( paidSubscribers: number ) {
	return {
		counts: {
			total_subscribers: 12840,
			email_subscribers: 9320,
			paid_subscribers: paidSubscribers,
			social_followers: 2340,
		},
	};
}
