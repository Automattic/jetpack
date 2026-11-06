/**
 * External dependencies
 */
import {
	ensureCoreSettingsReady,
	needsReportDateParamsSeed,
	type StatsDatePolicy,
} from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { dateWindowNoticeState } from './date-window-notice';
import { dateWindowNotice, limitStatsDateSearch } from './stats-date-window';

type Search = Record< string, unknown >;

/**
 * The redirect a route needs to seed its window and hold it to the plan, or undefined to load as asked.
 *
 * @param search            - The search the route would load.
 * @param policy            - The date policy the page follows.
 * @param options           - How the route seeds its search.
 * @param options.seed      - Builds the page's full search from `search`.
 * @param options.needsSeed - Whether a param other than the dates needs the seed.
 * @param options.requested - The window the reader asked for, which the notice names; omitted when they asked for none.
 * @return The search and history state to redirect with, or undefined.
 */
export async function dateWindowRedirect(
	search: Search,
	policy: StatsDatePolicy,
	{
		seed,
		needsSeed = false,
		requested,
	}: { seed: ( search: Search ) => Search; needsSeed?: boolean; requested?: Search }
): Promise< { search: Search; state: Search | undefined } | undefined > {
	let next: Search | undefined;
	// The seed check must read the same locks as the limit, or each undoes the other's interval.
	if ( needsSeed || needsReportDateParamsSeed( search, policy.lockedIntervals ) ) {
		// Warms the core `site` record for `useSiteHomeUrl()`; the seed's own dates don't depend on it.
		try {
			await ensureCoreSettingsReady();
		} catch {
			// Proceed with the seed.
		}

		const seeded = seed( search );
		next = limitStatsDateSearch( seeded, policy, { requested } ) ?? seeded;
	} else {
		next = limitStatsDateSearch( search, policy, { requested } );
	}

	return (
		next && {
			search: next,
			state: dateWindowNoticeState( requested ? dateWindowNotice( requested, policy ) : undefined ),
		}
	);
}
