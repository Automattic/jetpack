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
 * with the previous period only when the URL carries no window. A bare `preset`
 * is a detail page's way back, which must not undo a comparison switched off.
 *
 * @param search - The current route search params.
 * @return The normalized report params.
 */
export function seedReportDateParams( search: Record< string, unknown > ): ReportParams {
	const normalized = normalizeReportParams(
		search as Parameters< typeof normalizeReportParams >[ 0 ]
	);

	const isFreshLoad = ! search.from && ! search.to && ! search.preset;
	return isFreshLoad && ! hasComparisonEnabled( normalized )
		? withDefaultComparison( normalized )
		: normalized;
}
