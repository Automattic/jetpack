/**
 * External dependencies
 */
import type { StatsAppPlanUsage } from '@jetpack-premium-analytics/data';

// The share of the limit at which Stats starts warning, matching Calypso.
const NEAR_LIMIT_USAGE_RATIO = 0.9;

type PlanLimitStatus = {
	isOver: boolean;
};

/**
 * Where this cycle's views stand against the plan's limit. A missing or zero
 * limit means there is nothing to meter against.
 *
 * @param usage - The plan usage report.
 * @return The status once usage reaches 90% of the limit, otherwise `null`.
 */
export function getPlanLimitStatus( usage?: StatsAppPlanUsage ): PlanLimitStatus | null {
	const limit = usage?.views_limit;
	if ( ! limit ) {
		return null;
	}

	const used = usage.current_usage?.views_count ?? 0;
	if ( used < limit * NEAR_LIMIT_USAGE_RATIO ) {
		return null;
	}

	return { isOver: used >= limit };
}
