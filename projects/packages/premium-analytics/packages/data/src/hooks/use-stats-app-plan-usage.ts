/**
 * Internal dependencies
 */
import { statsAppPlanUsageQuery } from '../queries/stats-app-plan-usage-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';

export type StatsAppPlanPeriodUsage = {
	current_start: string | null;
	next_start: string | null;
	views_count: number;
	days_to_reset: number;
};

export type StatsAppPlanPriceTier = {
	maximum_price: number;
	maximum_price_display: string | null;
	maximum_price_monthly_display: string | null;
	maximum_units: number | null;
	minimum_price: number;
	minimum_price_display: string;
	minimum_price_monthly_display: string;
	minimum_units: number;
	per_unit_fee?: number;
	transform_quantity_divide_by?: number | null;
	limit?: number;
};

export type StatsAppPlanUsage = {
	current_usage: StatsAppPlanPeriodUsage;
	recent_usages: StatsAppPlanPeriodUsage[];
	// `null` when the site has no billable-views limit: no plan / free plan, or a
	// legacy/unlimited commercial subscription. Callers must branch on `null`.
	views_limit: number | null;
	// `null` whenever `views_limit` is `null` (no limit to be over).
	over_limit_months: number | null;
	current_tier: StatsAppPlanPriceTier;
	is_internal: boolean;
	billable_monthly_views: number;
	should_show_paywall: boolean;
	paywall_date_from: string | null;
	upgrade_deadline_date: string | null;
};

export function useStatsAppPlanUsage( options?: UseStatsAppOptions ) {
	return useStatsAppQuery< StatsAppPlanUsage >(
		statsAppPlanUsageQuery< StatsAppPlanUsage >(),
		options
	);
}
