/**
 * External dependencies
 */
import {
	hasComparisonEnabled,
	normalizeReportParams,
	withDefaultComparison,
	type ReportParams,
	NO_LOCKED_INTERVALS,
} from '@jetpack-premium-analytics/data';

/**
 * The date params a site-wide route seeds its URL with: normalized, and given the
 * default comparison only when the URL names no window. A URL with dates or a
 * preset keeps the comparison it carries, so switching it off sticks.
 *
 * @param search - The current route search params.
 * @return The normalized report params.
 */
export function seedSiteDateParams( search: Record< string, unknown > ): ReportParams {
	const normalized = normalizeReportParams(
		search as Parameters< typeof normalizeReportParams >[ 0 ],
		{ lockedIntervals: NO_LOCKED_INTERVALS }
	);

	const isFreshLoad = ! search.from && ! search.to && ! search.preset;
	return isFreshLoad && ! hasComparisonEnabled( normalized )
		? withDefaultComparison( normalized )
		: normalized;
}
