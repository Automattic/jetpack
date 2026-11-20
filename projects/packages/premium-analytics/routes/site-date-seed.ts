/**
 * External dependencies
 */
import {
	getPolicyDefaultPreset,
	hasComparisonEnabled,
	normalizeReportParams,
	withDefaultComparison,
	type ReportParams,
	type StatsDatePolicy,
} from '@jetpack-premium-analytics/data';

/**
 * The date params a site-wide route seeds its URL with: normalized, and given the
 * default comparison only when the URL names no window and the plan offers one. A URL
 * with dates or a preset keeps the comparison it carries, so switching it off sticks.
 *
 * @param search - The current route search params.
 * @param policy - The plan's date policy, for a route that follows it.
 * @return The normalized report params.
 */
export function seedSiteDateParams(
	search: Record< string, unknown >,
	policy?: StatsDatePolicy
): ReportParams {
	const normalized = normalizeReportParams(
		search as Parameters< typeof normalizeReportParams >[ 0 ],
		policy ? getPolicyDefaultPreset( policy ) : undefined,
		{ lockedIntervals: policy?.lockedIntervals }
	);

	const isFreshLoad = ! search.from && ! search.to && ! search.preset;
	const offersComparison = policy?.offersComparison ?? true;
	return isFreshLoad && offersComparison && ! hasComparisonEnabled( normalized )
		? withDefaultComparison( normalized )
		: normalized;
}
