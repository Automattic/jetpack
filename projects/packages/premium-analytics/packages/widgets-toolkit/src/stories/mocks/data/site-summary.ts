/**
 * Mock response for the Jetpack Stats site-summary endpoint
 * (`/proxy/v1.1/stats`, no sub-path), which returns all-time lifetime totals.
 * Consumed by the All-time stats, Most popular day, and Shares widgets via
 * `useStatsSite`. The `shares` total plus `shares_<service>` per-network counts
 * back the Shares widget.
 */
export const mockSiteSummary = {
	stats: {
		views: 62_588_309,
		visitors: 31_217_606,
		posts: 994,
		comments: 4_123,
		views_best_day: '2020-08-18',
		views_best_day_total: 197_500,
		shares: 21_640,
		shares_facebook: 12_840,
		shares_twitter: 5_320,
		shares_linkedin: 2_180,
		shares_tumblr: 1_300,
	},
};
