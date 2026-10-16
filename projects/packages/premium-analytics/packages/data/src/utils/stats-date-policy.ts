/**
 * External dependencies
 */
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
	type PrimaryPresetId,
	type QuickSurfacePresetId,
} from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { getDefaultPreset } from '../defaults/reports';
import { resolveIntervalForRange } from './interval';
import { isStatsFeatureLocked, type StatsFeatureKey } from './plan-gates';
import { computeDateRangeFromPreset } from './preset-date-range';
import {
	hasComparisonEnabled,
	type IntervalType,
	type PresetType,
	type ReportParams,
} from './search';
import { withoutComparison } from './without-comparison';

export type DateLimitFeature = Extract< StatsFeatureKey, 'recent-7-days' | 'long-date-presets' >;

/** What the site's plan lets the date controls offer. */
export type StatsDatePolicy = {
	/** The lock whose upsell explains the limit; unset when no date is limited. */
	feature?: DateLimitFeature;
	earliestDate?: Date;
	lockedPresetIds: readonly QuickSurfacePresetId[];
	/** Where a locked or too-early window lands. */
	fallbackPresetId?: typeof PRESET_LAST_7_DAYS | typeof PRESET_LAST_30_DAYS;
	lockedIntervals: readonly IntervalType[];
	offersComparison: boolean;
};

// Classic Stats' basic plan locks these shortcuts, not ranges past 30 days.
const LONG_DATE_PRESETS: readonly QuickSurfacePresetId[] = [
	PRESET_LAST_90_DAYS,
	PRESET_LAST_365_DAYS,
	PRESET_YEAR_TO_DATE,
	PRESET_LAST_12_MONTHS,
	PRESET_LAST_YEAR,
	PRESET_ALL_TIME,
];

const LOCKABLE_INTERVALS: readonly IntervalType[] = [ 'week', 'month', 'year' ];

export const OPEN_DATE_POLICY: StatsDatePolicy = {
	lockedPresetIds: [],
	lockedIntervals: [],
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
	const lockedIntervals = isLocked( 'intervals' ) ? LOCKABLE_INTERVALS : [];

	if ( isLocked( 'recent-7-days' ) ) {
		const earliestDate = computePrimaryRange( PRESET_LAST_7_DAYS, timeZone )?.from;

		return {
			feature: 'recent-7-days',
			earliestDate,
			// All time resolves no start without one, so it counts as starting too early.
			lockedPresetIds: MENU_SURFACE_PRESETS_WITH_ALL_TIME.filter( id => {
				const from = computePrimaryRange( id, timeZone )?.from;
				return ! from || ! earliestDate || from < earliestDate;
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

	// A single year is longer than either limit allows.
	if ( isYearPresetId( presetId ) ) {
		return policy.lockedPresetIds.length > 0;
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
	return isPresetLockedByPolicy( defaultPreset, policy ) && policy.fallbackPresetId
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

	const landing = landingPresetId ?? policy.fallbackPresetId;
	if ( landing && ( startsTooEarly || isPresetLockedByPolicy( params.preset, policy ) ) ) {
		const range = computeDateRangeFromPreset( landing );
		if ( range ) {
			next = {
				...next,
				...range,
				preset: landing,
				interval: resolveIntervalForRange(
					landing,
					range.from,
					range.to,
					next.interval,
					policy.lockedIntervals
				),
			};
			isWindowAdjusted = true;
		}
	}

	// A comparison set up for the replaced window no longer describes the shown one.
	const isComparisonDropped =
		( ! policy.offersComparison || isWindowAdjusted ) && hasComparisonEnabled( next );
	if ( isComparisonDropped ) {
		next = withoutComparison( next );
	}

	return { params: next, isWindowAdjusted, isComparisonDropped };
}
