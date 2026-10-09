/**
 * External dependencies
 */
import {
	hasComparisonEnabled,
	normalizeReportParams,
	withDefaultComparison,
	type ReportParams,
} from '@jetpack-premium-analytics/data';

/**
 * The date params a site-wide route seeds its URL with: normalized, and compared
 * with the previous period only when the URL names no window. A URL with dates or
 * a preset keeps the comparison it carries, so switching it off sticks.
 *
 * @param search - The current route search params.
 * @return The normalized report params.
 */
export function seedSiteDateParams( search: Record< string, unknown > ): ReportParams {
	const normalized = normalizeReportParams(
		search as Parameters< typeof normalizeReportParams >[ 0 ]
	);

	const isFreshLoad = ! search.from && ! search.to && ! search.preset;
	return isFreshLoad && ! hasComparisonEnabled( normalized )
		? withDefaultComparison( normalized )
		: normalized;
}
