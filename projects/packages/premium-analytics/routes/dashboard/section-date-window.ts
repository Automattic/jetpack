/**
 * External dependencies
 */
import {
	getPolicyDefaultPreset,
	getStatsDatePolicy,
	hasComparisonEnabled,
	withoutComparison,
	type StatsDatePolicy,
} from '@jetpack-premium-analytics/data';
import { reportingTimeZone, type PrimaryPresetId } from '@jetpack-premium-analytics/datetime';
import { REPORT_DATE_PARAM_KEYS, buildRangePatch } from '@jetpack-premium-analytics/routing';
/**
 * Internal dependencies
 */
import { seedSiteDateParams } from '../site-date-seed';
import {
	adjustsStatsDateWindow,
	isPlanDateLimitedSection,
	limitStatsDateSearch,
} from '../stats-date-window';
import { resolveSurfaceRange, toDateFilterSurface } from './config/date-filter';
import type { DashboardSection } from './config/sections';

export type DashboardSearch = Record< string, string | undefined >;

/**
 * The search the dashboard opens on when its URL lacks a complete window.
 *
 * @param params - The search to seed.
 * @param policy - The plan's date policy, for a section that follows it.
 * @return The seeded search, within the plan.
 */
export function seedDashboardDateSearch(
	params: DashboardSearch,
	policy?: StatsDatePolicy
): DashboardSearch {
	// Seeded inside the plan, so the default comparison is not dropped with a replaced window.
	const normalized = seedSiteDateParams(
		params,
		policy ? getPolicyDefaultPreset( policy ) : undefined
	);

	/*
	 * Overlay the seeded params onto `params`, not replace them, so
	 * passthrough params like `section` survive the seed. Comparison keys
	 * only survive when the seed returned a complete comparison: a
	 * hand-edited bare `comp=1` must not outlive it.
	 */
	const merged = { ...params, ...normalized } as DashboardSearch;
	const seeded = hasComparisonEnabled( normalized ) ? merged : withoutComparison( merged );

	return ( policy && limitStatsDateSearch( seeded, params ) ) || seeded;
}

/**
 * The date params a tab switch commits with the section, so it lands on its settled window in one navigation.
 *
 * @param id      - The tab switched to.
 * @param section - The section whose date filter that tab shows.
 * @param search  - The search the switch carries.
 * @return The date params to commit (undefined ones clear), or undefined to keep the window.
 */
export function dateWindowForSectionSwitch(
	id: string,
	section: DashboardSection | undefined,
	search: Record< string, unknown >
): Record< string, unknown > | undefined {
	const policy = isPlanDateLimitedSection( id ) ? getStatsDatePolicy() : undefined;

	// The reader did not ask for that window here, so open as a fresh load would: no redirect, no notice.
	if ( policy && adjustsStatsDateWindow( search, policy ) ) {
		const params = { ...search, section: id } as DashboardSearch;
		for ( const key of REPORT_DATE_PARAM_KEYS ) {
			delete params[ key ];
		}
		const seeded = seedDashboardDateSearch( params, policy );

		return Object.fromEntries( REPORT_DATE_PARAM_KEYS.map( key => [ key, seeded[ key ] ] ) );
	}

	if ( ! section ) {
		return undefined;
	}

	const timeZone = reportingTimeZone();
	const next = resolveSurfaceRange(
		toDateFilterSurface( section.date_filter ),
		search.preset as PrimaryPresetId | undefined,
		policy,
		timeZone
	);

	if ( ! next ) {
		return undefined;
	}

	return (
		buildRangePatch( {
			nextRange: next.range,
			nextPresetId: next.presetId,
			effective: search as Parameters< typeof buildRangePatch >[ 0 ][ 'effective' ],
			lockedIntervals: policy?.lockedIntervals,
		} ) ?? undefined
	);
}
