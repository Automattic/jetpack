/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import {
	applyStatsDatePolicy,
	getPolicyDefaultPreset,
	getStatsDatePolicy,
	normalizeReportParams,
	withoutComparison,
	type StatsDatePolicy,
} from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { queueDateWindowNotice } from './date-window-notice';

type Search = Record< string, unknown >;
type NormalizeInput = Parameters< typeof normalizeReportParams >[ 0 ];

/** Dashboard tabs whose window follows the plan; Insights is a year surface and stays out. */
export const PLAN_DATE_LIMITED_SECTIONS: readonly string[] = [ 'traffic' ];

/**
 * Whether a dashboard tab follows the plan's date limits; an unknown or absent one is the first tab.
 *
 * @param section - The `section` search param.
 * @return Whether its window is limited.
 */
export function isPlanDateLimitedSection( section: unknown ): boolean {
	const slugs = getScriptData()?.premium_analytics?.sections;
	const isKnown =
		typeof section === 'string' && ( ! Array.isArray( slugs ) || slugs.includes( section ) );
	const active = isKnown ? section : slugs?.[ 0 ];

	return typeof active === 'string' && PLAN_DATE_LIMITED_SECTIONS.includes( active );
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
 * @param search    - The search the route would load.
 * @param requested - The search the reader asked for: `search` before a seed, or `{}` for none.
 * @return The limited search, or undefined.
 */
export function limitStatsDateSearch< T extends Search >(
	search: T,
	requested: Search = search
): T | undefined {
	const policy = getStatsDatePolicy();
	if ( ! policy.feature && ! policy.lockedIntervals.length ) {
		return undefined;
	}

	// Only a window the reader asked for gets a notice, so it lands where the notice says;
	// any other opens on their default preset.
	const isRequested = adjustsStatsDateWindow( requested, policy );
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

	if ( isWindowAdjusted && policy.feature && isRequested ) {
		queueDateWindowNotice( policy.feature, limited );
	}

	return limited as T;
}
