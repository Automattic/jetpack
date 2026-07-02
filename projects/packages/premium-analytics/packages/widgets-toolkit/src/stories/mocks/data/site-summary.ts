/**
 * Mock response for the Jetpack Stats site-summary endpoint
 * (`/proxy/v1.1/stats`, no sub-path), which returns all-time lifetime totals.
 * Consumed by the All-time stats and Most popular day widgets via `useStatsSite`.
 */
export const mockSiteSummary = {
	stats: {
		views: 62_588_309,
		visitors: 31_217_606,
		posts: 994,
		comments: 4_123,
		views_best_day: '2020-08-18',
		views_best_day_total: 197_500,
	},
};
