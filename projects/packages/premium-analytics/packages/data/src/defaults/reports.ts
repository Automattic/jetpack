/**
 * External dependencies
 */
import {
	dateToISOStringWithLocalTZ,
	findComparisonOption,
	getComparisonOptions,
	getComparisonRangeFromPreset,
	localTZDate,
	type ComparisonPresetId,
} from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
// Leaf modules, not the `../utils` barrel, which loads `@wordpress/core-data`.
import { getDefaultIntervalForPeriod } from '../utils/interval';
import { computeDateRangeFromPreset } from '../utils/preset-date-range';
import {
	NO_COMPARISON,
	getRememberedComparison,
	getRememberedPreset,
	getStatsV1Preset,
} from './remembered-preset';
import type { PresetType, ReportParams } from '../utils/search';

/**
 * The preset a page opens on when its URL names no dates: the reader's last applied
 * preset, else their Jetpack Stats v1 range, else the last 7 days v1 also opened on.
 */
export function getDefaultPreset(): PresetType {
	return getRememberedPreset() ?? getStatsV1Preset() ?? 'last-7-days';
}

/**
 * The report params a widget that owns its date range starts on.
 *
 * A preset alone, so `normalizeReportParams` recomputes its moving end on every
 * load rather than freezing the dates the module was built on.
 */
export function getDefaultReportParams(): { preset: PresetType } {
	return { preset: getDefaultPreset() };
}

/**
 * Add a comparison preset's window to the params.
 *
 * @param params   - Report params for the primary range.
 * @param presetId - The comparison preset.
 * @return The params with the comparison, or unchanged when none resolves.
 */
function withComparisonPreset( params: ReportParams, presetId: ComparisonPresetId ): ReportParams {
	const comparison = getComparisonRangeFromPreset(
		{ from: localTZDate( params.from ), to: localTZDate( params.to ) },
		presetId,
		{ primaryPresetId: params.preset }
	);

	if ( ! comparison?.from || ! comparison.to ) {
		return params;
	}

	return {
		...params,
		compare_from: dateToISOStringWithLocalTZ( comparison.from ),
		compare_to: dateToISOStringWithLocalTZ( comparison.to ),
		compare_preset: presetId,
		comp: '1',
	};
}

/**
 * Add the comparison a fresh load starts on: the reader's last applied one, else the previous period.
 *
 * @param params - Report params for the primary range.
 * @return The params with the comparison, or unchanged when none applies.
 */
export function withDefaultComparison( params: ReportParams ): ReportParams {
	const remembered = getRememberedComparison();

	if ( remembered === NO_COMPARISON ) {
		return params;
	}

	// A remembered preset the range does not offer, say the previous week of a year, falls back.
	const isOffered =
		remembered !== undefined &&
		!! findComparisonOption(
			getComparisonOptions(
				{ from: localTZDate( params.from ), to: localTZDate( params.to ) },
				{ primaryPresetId: params.preset }
			),
			remembered
		);

	return withComparisonPreset( params, isOffered ? remembered : 'previous-period' );
}

/**
 * Build report query parameters for the given preset, optionally with the
 * previous-period comparison range.
 */
export const getDefaultQueryParams = (
	withComparison: boolean = false,
	preset: PresetType = getDefaultPreset()
): ReportParams => {
	const range = computeDateRangeFromPreset( preset );

	if ( ! range ) {
		throw new Error( `Unknown preset: ${ preset }` );
	}

	const params: ReportParams = {
		from: range.from,
		to: range.to,
		preset,
		interval: getDefaultIntervalForPeriod( preset, range.from, range.to ),
	};

	return withComparison ? withComparisonPreset( params, 'previous-period' ) : params;
};
