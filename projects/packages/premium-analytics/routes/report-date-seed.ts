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
 * with the previous period when the URL names no range of its own.
 *
 * @param search - The current route search params.
 * @return The normalized report params.
 */
export function seedReportDateParams( search: Record< string, unknown > ): ReportParams {
	const normalized = normalizeReportParams(
		search as Parameters< typeof normalizeReportParams >[ 0 ]
	);

	const isFreshLoad = ! search.from && ! search.to;
	return isFreshLoad && ! hasComparisonEnabled( normalized )
		? withDefaultComparison( normalized )
		: normalized;
}
