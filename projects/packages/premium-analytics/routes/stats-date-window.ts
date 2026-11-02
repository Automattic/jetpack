/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import {
	applyStatsDatePolicy,
	getPolicyDefaultPreset,
	isDateLimitedPolicy,
	isPresetLockedByPolicy,
	normalizeReportParams,
	withoutComparison,
	type DateLimitFeature,
	type StatsDatePolicy,
} from '@jetpack-premium-analytics/data';
import { isYearSurfacePresetId } from '@jetpack-premium-analytics/datetime';
import { omitReportDateParams } from '@jetpack-premium-analytics/routing';

type Search = Record< string, unknown >;
type NormalizeInput = Parameters< typeof normalizeReportParams >[ 0 ];

/**
 * The dashboard tab a `section` search param shows; an unknown or absent one is the first tab.
 *
 * @param section - The `section` search param.
 * @return The tab's slug, or undefined when the server lists no tabs.
 */
export function dashboardSectionOf( section: unknown ): string | undefined {
	const slugs = getScriptData()?.premium_analytics?.sections;
	const isKnown =
		typeof section === 'string' && ( ! Array.isArray( slugs ) || slugs.includes( section ) );
	const active = isKnown ? section : slugs?.[ 0 ];

	return typeof active === 'string' ? active : undefined;
}

/**
 * The search without the dates when they name a year the plan locks.
 *
 * @param search - The search the route would load.
 * @param policy - The date policy the page follows.
 * @return A copy of the search, without its dates when they name a locked year or all time.
 */
export function withoutCarriedYearWindow( search: Search, policy: StatsDatePolicy ): Search {
	// Only a year surface such as Insights offers a year or all time, so a locked one was carried
	// over from it: drop the dates and open on the default, without a notice.
	return isYearSurfacePresetId( search.preset ) && isPresetLockedByPolicy( search.preset, policy )
		? omitReportDateParams( search )
		: { ...search };
}

/**
 * Whether the plan would move the window this search names.
 *
 * @param search - The search to inspect.
 * @param policy - The site's date policy.
 * @return Whether the window is adjusted.
 */
export function adjustsStatsDateWindow( search: Search, policy: StatsDatePolicy ): boolean {
	if ( ! search.from && ! search.to && ! search.preset ) {
		return false;
	}

	return applyStatsDatePolicy( normalizeReportParams( search as NormalizeInput ), policy )
		.isWindowAdjusted;
}

/**
 * The search with the plan's date limits applied, or undefined when it already complies.
 *
 * @param search             - The search the route would load.
 * @param policy             - The date policy the page follows.
 * @param location           - Where the route loads it.
 * @param location.requested - The search the reader asked for, `search` before a seed; omitted when they asked for none.
 * @return The limited search, or undefined.
 */
export function limitStatsDateSearch(
	search: Search,
	policy: StatsDatePolicy,
	{ requested }: { requested?: Search } = {}
): Search | undefined {
	if ( ! isDateLimitedPolicy( policy ) ) {
		return undefined;
	}

	// A requested window lands on the fallback the notice names; any other opens on the
	// reader's default preset, with no notice.
	const isRequested = !! requested && adjustsStatsDateWindow( requested, policy );
	const { params, isWindowAdjusted, isComparisonDropped } = applyStatsDatePolicy(
		normalizeReportParams( search as NormalizeInput, undefined, {
			lockedIntervals: policy.lockedIntervals,
		} ),
		policy,
		isRequested ? undefined : getPolicyDefaultPreset( policy )
	);
	// Against the URL as it came in: the normalized params already carry the open bucket.
	const isIntervalAdjusted = params.interval !== search.interval;
	if ( ! isWindowAdjusted && ! isComparisonDropped && ! isIntervalAdjusted ) {
		return undefined;
	}

	const limited: Search = isComparisonDropped ? withoutComparison( search ) : { ...search };
	limited.interval = params.interval;
	if ( isWindowAdjusted ) {
		limited.from = params.from;
		limited.to = params.to;
		limited.preset = params.preset;
	}

	return limited;
}

/**
 * The limit to tell the reader about when the plan moves the window they asked for.
 *
 * @param requested - The search the reader asked for.
 * @param policy    - The date policy the page follows.
 * @return The locked feature, or undefined.
 */
export function dateWindowNotice(
	requested: Search,
	policy: StatsDatePolicy
): DateLimitFeature | undefined {
	return policy.feature && adjustsStatsDateWindow( requested, policy ) ? policy.feature : undefined;
}
