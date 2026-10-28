/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import {
	computePrimaryRange,
	isYearPresetId,
	MENU_SURFACE_PRESETS_WITH_ALL_TIME,
	parseSiteDateTime,
	PRESET_ALL_TIME,
	PRESET_LAST_12_MONTHS,
	PRESET_LAST_30_DAYS,
	PRESET_LAST_365_DAYS,
	PRESET_LAST_7_DAYS,
	PRESET_LAST_90_DAYS,
	PRESET_LAST_YEAR,
	PRESET_YEAR_TO_DATE,
	reportingTimeZone,
	toLocalTZ,
	type PrimaryPresetId,
	type QuickSurfacePresetId,
} from '@jetpack-premium-analytics/datetime';
import { startOfDay } from 'date-fns';
/**
 * Internal dependencies
 */
import { getDefaultPreset } from '../defaults/reports';
import { NO_LOCKED_INTERVALS, resolveIntervalForRange, type LockableInterval } from './interval';
import { isStatsFeatureLocked, type StatsFeatureKey } from './plan-gates';
import { computeDateRangeFromPreset } from './preset-date-range';
import { hasComparisonEnabled, type PresetType, type ReportParams } from './search';
import { withoutComparison } from './without-comparison';

export type DateLimitFeature = Extract< StatsFeatureKey, 'recent-7-days' | 'long-date-presets' >;

type OpenDatePolicy = {
	feature?: undefined;
	earliestDate?: undefined;
	lockedPresetIds: readonly [];
	fallbackPresetId?: undefined;
	lockedIntervals: readonly LockableInterval[];
	offersComparison: true;
};

type RecentDaysPolicy = {
	feature: Extract< DateLimitFeature, 'recent-7-days' >;
	/** The first day the plan shows, at its start in the site's timezone; earlier ranges are locked. */
	earliestDate: Date;
	lockedPresetIds: readonly QuickSurfacePresetId[];
	fallbackPresetId: typeof PRESET_LAST_7_DAYS;
	lockedIntervals: readonly LockableInterval[];
	offersComparison: false;
};

type LongDatePresetsPolicy = {
	feature: Extract< DateLimitFeature, 'long-date-presets' >;
	earliestDate?: undefined;
	lockedPresetIds: readonly QuickSurfacePresetId[];
	fallbackPresetId: typeof PRESET_LAST_30_DAYS;
	lockedIntervals: readonly LockableInterval[];
	offersComparison: true;
};

/**
 * What the site's plan lets the date controls offer. `feature` names the lock whose upsell
 * explains the limit, and `fallbackPresetId` is where a locked or too-early window lands.
 */
export type StatsDatePolicy = OpenDatePolicy | RecentDaysPolicy | LongDatePresetsPolicy;

// Classic Stats' basic plan locks these shortcuts, not ranges past 30 days.
const LONG_DATE_PRESETS: readonly QuickSurfacePresetId[] = [
	PRESET_LAST_90_DAYS,
	PRESET_LAST_365_DAYS,
	PRESET_YEAR_TO_DATE,
	PRESET_LAST_12_MONTHS,
	PRESET_LAST_YEAR,
	PRESET_ALL_TIME,
];

const LOCKABLE_INTERVALS: readonly LockableInterval[] = [ 'week', 'month', 'year' ];

export const OPEN_DATE_POLICY: StatsDatePolicy = {
	lockedPresetIds: [],
	lockedIntervals: NO_LOCKED_INTERVALS,
	offersComparison: true,
};

/**
 * Turn the plan's date locks into what the controls offer.
 *
 * @param isLocked - Whether the plan locks a feature.
 * @param timeZone - The site's reporting timezone.
 * @return The policy.
 */
export function deriveStatsDatePolicy(
	isLocked: ( feature: StatsFeatureKey ) => boolean,
	timeZone: string
): StatsDatePolicy {
	const lockedIntervals = isLocked( 'intervals' ) ? LOCKABLE_INTERVALS : NO_LOCKED_INTERVALS;

	if ( isLocked( 'recent-7-days' ) ) {
		// An unreadable window fails closed, to today, rather than opening every date.
		const earliestDate =
			computePrimaryRange( PRESET_LAST_7_DAYS, timeZone )?.from ??
			startOfDay( toLocalTZ( undefined, timeZone ) );

		return {
			feature: 'recent-7-days',
			earliestDate,
			lockedPresetIds: MENU_SURFACE_PRESETS_WITH_ALL_TIME.filter( id => {
				const from = computePrimaryRange( id, timeZone )?.from;
				return ! from || from < earliestDate;
			} ),
			fallbackPresetId: PRESET_LAST_7_DAYS,
			lockedIntervals,
			// The previous period lies outside the window.
			offersComparison: false,
		};
	}

	if ( isLocked( 'long-date-presets' ) ) {
		return {
			feature: 'long-date-presets',
			lockedPresetIds: LONG_DATE_PRESETS,
			fallbackPresetId: PRESET_LAST_30_DAYS,
			lockedIntervals,
			offersComparison: true,
		};
	}

	return lockedIntervals.length ? { ...OPEN_DATE_POLICY, lockedIntervals } : OPEN_DATE_POLICY;
}

/**
 * The policy for this site's plan, as the server published its gates.
 *
 * @return The policy.
 */
export function getStatsDatePolicy(): StatsDatePolicy {
	return deriveStatsDatePolicy( isStatsFeatureLocked, reportingTimeZone() );
}

/**
 * Whether a dashboard section's dates follow the plan, as its server registration declares.
 *
 * @param section - The section slug.
 * @return Whether its window is limited.
 */
export function isPlanDateLimitedSection( section: string | undefined ): boolean {
	const limited = getScriptData()?.premium_analytics?.plan_date_limited_sections;

	return !! section && Array.isArray( limited ) && limited.includes( section );
}

/**
 * The policy a dashboard section, or a page under it, follows.
 *
 * @param section - The section slug.
 * @return The site's policy for a limited section, else `OPEN_DATE_POLICY`.
 */
export function getSectionDatePolicy( section: string | undefined ): StatsDatePolicy {
	return isPlanDateLimitedSection( section ) ? getStatsDatePolicy() : OPEN_DATE_POLICY;
}

/**
 * Whether a policy limits anything: a feature it locks, or a locked bucket.
 *
 * @param policy - The policy.
 * @return Whether it sets a limit.
 */
export function isDateLimitedPolicy( policy: StatsDatePolicy ): boolean {
	return !! policy.feature || policy.lockedIntervals.length > 0;
}

/**
 * Whether the policy locks a preset.
 *
 * @param presetId - The preset.
 * @param policy   - The policy.
 * @return Whether it is locked.
 */
export function isPresetLockedByPolicy(
	presetId: PrimaryPresetId | undefined,
	policy: StatsDatePolicy
): boolean {
	if ( ! presetId ) {
		return false;
	}

	// A single year is Insights' window, so a plan-limited surface locks every one.
	if ( isYearPresetId( presetId ) ) {
		return !! policy.feature;
	}

	return ( policy.lockedPresetIds as readonly string[] ).includes( presetId );
}

/**
 * The preset a page opens on when its URL names no dates, within what the policy allows.
 *
 * @param policy        - The policy.
 * @param defaultPreset - The preset the reader would open on without the policy.
 * @return The default preset, or the policy's fallback when it locks that one.
 */
export function getPolicyDefaultPreset(
	policy: StatsDatePolicy,
	defaultPreset: PresetType = getDefaultPreset()
): PresetType {
	return policy.feature && isPresetLockedByPolicy( defaultPreset, policy )
		? policy.fallbackPresetId
		: defaultPreset;
}

/**
 * Report params the policy allows, and what it had to change.
 *
 * @param params          - Normalized report params.
 * @param policy          - The policy.
 * @param landingPresetId - Where a replaced window lands instead of the policy's fallback.
 * @return The allowed params and what changed.
 */
export function applyStatsDatePolicy(
	params: ReportParams,
	policy: StatsDatePolicy,
	landingPresetId?: PresetType
): {
	params: ReportParams;
	isWindowAdjusted: boolean;
	isComparisonDropped: boolean;
} {
	let next = params;
	let isWindowAdjusted = false;

	const from = parseSiteDateTime( params.from );
	const startsTooEarly = !! policy.earliestDate && ( ! from || from < policy.earliestDate );

	if ( policy.feature && ( startsTooEarly || isPresetLockedByPolicy( params.preset, policy ) ) ) {
		const landing = landingPresetId
			? getPolicyDefaultPreset( policy, landingPresetId )
			: policy.fallbackPresetId;
		const range = computeDateRangeFromPreset( landing );
		if ( range ) {
			next = { ...next, ...range, preset: landing };
			isWindowAdjusted = true;
		}
	}

	// Even a kept window may carry a bucket the plan locks, when its params were normalized without them.
	const interval = resolveIntervalForRange(
		next.preset,
		next.from,
		next.to,
		next.interval,
		policy.lockedIntervals
	);
	if ( interval !== next.interval ) {
		next = { ...next, interval };
	}

	// A comparison set up for the replaced window no longer describes the shown one.
	const isComparisonDropped =
		( ! policy.offersComparison || isWindowAdjusted ) && hasComparisonEnabled( next );
	if ( isComparisonDropped ) {
		next = withoutComparison( next );
	}

	return { params: next, isWindowAdjusted, isComparisonDropped };
}
