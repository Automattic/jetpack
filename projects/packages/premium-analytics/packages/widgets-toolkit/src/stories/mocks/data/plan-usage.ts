/**
 * Mock response for the Stats "plan usage" endpoint
 * (`/proxy/v2/jetpack-stats/usage`). Matches the `StatsAppPlanUsage` shape read
 * by `useStatsAppPlanUsage`: a current-cycle billable-views reading against the
 * plan's limit. Usage sits comfortably under the limit so the gauge renders
 * partially filled without tripping the over-limit warning.
 */
export const mockPlanUsageData = {
	current_usage: {
		current_start: '2026-06-01',
		next_start: '2026-07-01',
		views_count: 6200,
		days_to_reset: 12,
	},
	recent_usages: [
		{ current_start: '2026-05-01', next_start: '2026-06-01', views_count: 5400, days_to_reset: 0 },
		{ current_start: '2026-04-01', next_start: '2026-05-01', views_count: 4800, days_to_reset: 0 },
	],
	views_limit: 10000,
	over_limit_months: 0,
	current_tier: {
		maximum_price: 0,
		maximum_price_display: null,
		maximum_price_monthly_display: null,
		maximum_units: 10000,
		minimum_price: 0,
		minimum_price_display: '$0',
		minimum_price_monthly_display: '$0',
		minimum_units: 0,
		limit: 10000,
	},
	is_internal: false,
	billable_monthly_views: 6200,
	should_show_paywall: false,
	paywall_date_from: null,
	upgrade_deadline_date: null,
};
