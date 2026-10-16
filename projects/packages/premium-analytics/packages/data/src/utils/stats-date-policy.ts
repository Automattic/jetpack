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
import { resolveIntervalForRange, type LockableInterval } from './interval';
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

	const lastSevenDays = isLocked( 'recent-7-days' )
		? computePrimaryRange( PRESET_LAST_7_DAYS, timeZone )
		: undefined;

	if ( lastSevenDays ) {
		const earliestDate = lastSevenDays.from;

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
		const landing = landingPresetId ?? policy.fallbackPresetId;
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
