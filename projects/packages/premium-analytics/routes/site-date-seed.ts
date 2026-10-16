/**
 * External dependencies
 */
import {
	hasComparisonEnabled,
	normalizeReportParams,
	withDefaultComparison,
	type LockableInterval,
	type PresetType,
	type ReportParams,
} from '@jetpack-premium-analytics/data';

/**
 * The date params a site-wide route seeds its URL with: normalized, and given the
 * default comparison only when the URL names no window. A URL with dates or a
 * preset keeps the comparison it carries, so switching it off sticks.
 *
 * @param search                  - The current route search params.
 * @param defaultPreset           - The preset a URL without dates opens on, if not the reader's own.
 * @param options                 - How the route's plan shapes the seed.
 * @param options.lockedIntervals - The buckets the route's plan locks.
 * @return The normalized report params.
 */
export function seedSiteDateParams(
	search: Record< string, unknown >,
	defaultPreset?: PresetType,
	{ lockedIntervals }: { lockedIntervals?: readonly LockableInterval[] } = {}
): ReportParams {
	const normalized = normalizeReportParams(
		search as Parameters< typeof normalizeReportParams >[ 0 ],
		defaultPreset,
		{ lockedIntervals }
	);

	const isFreshLoad = ! search.from && ! search.to && ! search.preset;
	return isFreshLoad && ! hasComparisonEnabled( normalized )
		? withDefaultComparison( normalized )
		: normalized;
}
