/**
 * External dependencies
 */
import {
	getSectionDatePolicy,
	hasComparisonEnabled,
	withoutComparison,
	type StatsDatePolicy,
} from '@jetpack-premium-analytics/data';
import { reportingTimeZone } from '@jetpack-premium-analytics/datetime';
import {
	REPORT_DATE_PARAM_KEYS,
	buildRangePatch,
	omitReportDateParams,
} from '@jetpack-premium-analytics/routing';
/**
 * Internal dependencies
 */
import { seedSiteDateParams } from '../site-date-seed';
import {
	adjustsStatsDateWindow,
	dashboardSectionOf,
	limitStatsDateSearch,
} from '../stats-date-window';
import { resolveSurfaceRange, toDateFilterSurface } from './config/date-filter';
import type { DashboardSection } from './config/sections';

export type DashboardSearch = Record< string, unknown >;

/** Every date param, an undefined value clearing it when committed. */
type DateWindow = Record< ( typeof REPORT_DATE_PARAM_KEYS )[ number ], unknown >;

/**
 * The search the dashboard opens on when its URL lacks a complete window.
 *
 * @param params - The search to seed.
 * @param policy - The date policy the section follows.
 * @return The seeded search, within the plan.
 */
export function seedDashboardDateSearch(
	params: DashboardSearch,
	policy: StatsDatePolicy
): Record< string, unknown > {
	// Seeded inside the plan, so the default comparison is not dropped with a replaced window.
	const normalized = seedSiteDateParams( params, policy );

	/*
	 * Overlay the seeded params onto `params`, not replace them, so
	 * passthrough params like `section` survive the seed. Comparison keys
	 * only survive when the seed returned a complete comparison: a
	 * hand-edited bare `comp=1` must not outlive it.
	 */
	const merged = { ...params, ...normalized };
	const seeded = hasComparisonEnabled( normalized ) ? merged : withoutComparison( merged );

	return limitStatsDateSearch( seeded, policy, { requested: params } ) ?? seeded;
}

/**
 * The date params of a search.
 *
 * @param search - The search.
 * @return Its date params.
 */
function pickDateWindow( search: Record< string, unknown > ): DateWindow {
	return Object.fromEntries(
		REPORT_DATE_PARAM_KEYS.map( key => [ key, search[ key ] ] )
	) as DateWindow;
}

/**
 * The date params a tab switch commits with the section, so it lands on its settled window in one navigation.
 *
 * @param id      - The tab switched to.
 * @param section - The section whose date filter that tab shows.
 * @param search  - The search the switch carries.
 * @return The date params to commit, or undefined to keep the window.
 */
export function dateWindowForSectionSwitch(
	id: string,
	section: DashboardSection | undefined,
	search: Record< string, unknown >
): DateWindow | undefined {
	const policy = getSectionDatePolicy( dashboardSectionOf( id ) );

	// The reader did not ask for that window here, so open as a fresh load would: no redirect, no notice.
	if ( adjustsStatsDateWindow( search, policy ) ) {
		return pickDateWindow( seedDashboardDateSearch( omitReportDateParams( search ), policy ) );
	}

	const patch = section ? surfaceRangePatch( section, search, policy ) : undefined;
	const patched = { ...search, ...patch };
	// The comparison or bucket the plan strips, which the route would otherwise drop in a second navigation.
	const limited = limitStatsDateSearch( patched, policy );

	return limited || patch ? pickDateWindow( limited ?? patched ) : undefined;
}

/**
 * The date params that move a search onto the range a section's date filter shows.
 *
 * @param section - The section.
 * @param search  - The search the switch carries.
 * @param policy  - The date policy the section follows.
 * @return The date params to commit, or undefined when the range fits.
 */
function surfaceRangePatch(
	section: DashboardSection,
	search: Record< string, unknown >,
	policy: StatsDatePolicy
): Record< string, unknown > | undefined {
	const next = resolveSurfaceRange(
		toDateFilterSurface( section.date_filter ),
		search.preset,
		policy,
		reportingTimeZone()
	);

	if ( ! next ) {
		return undefined;
	}

	return (
		buildRangePatch( {
			nextRange: next.range,
			nextPresetId: next.presetId,
			effective: search as Parameters< typeof buildRangePatch >[ 0 ][ 'effective' ],
			lockedIntervals: policy.lockedIntervals,
		} ) ?? undefined
	);
}
