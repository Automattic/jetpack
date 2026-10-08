/**
 * External dependencies
 */
import {
	dateToISOStringWithLocalTZ,
	getComparisonRangeFromPreset,
	localTZDate,
} from '@jetpack-premium-analytics/datetime';
import { differenceInCalendarDays, startOfDay } from 'date-fns';
/**
 * Internal dependencies
 */
// Leaf modules, not the `../utils` barrel, which loads `@wordpress/core-data`.
import { getDefaultIntervalForPeriod } from '../utils/interval';
import { computeDateRangeFromPreset } from '../utils/preset-date-range';
import { getStoreInfo } from './store-info';
import type { PresetType, ReportParams } from '../utils/search';

const DEFAULT_PRESET: PresetType = 'last-30-days';

/**
 * Pick the default date-range preset based on how long the store has been live.
 */
export function getDefaultPreset( launchedDate?: string ): PresetType {
	if ( ! launchedDate ) {
		return DEFAULT_PRESET;
	}

	const today = startOfDay( localTZDate() );
	const launched = startOfDay( localTZDate( launchedDate ) );
	const daysSinceLaunch = differenceInCalendarDays( today, launched );

	if ( daysSinceLaunch <= 0 ) {
		return 'today';
	}

	if ( daysSinceLaunch <= 7 ) {
		return 'last-7-days';
	}

	return DEFAULT_PRESET;
}

/**
 * The report params a widget that owns its date range starts on.
 *
 * A preset alone, so `normalizeReportParams` recomputes its moving end on every
 * load rather than freezing the dates the module was built on.
 */
export function getDefaultReportParams(): { preset: PresetType } {
	return { preset: getDefaultPreset( getStoreInfo().launchedDate ) };
}

/**
 * Add the previous-period comparison a fresh load starts on.
 *
 * @param params - Report params for the primary range.
 * @return The params with the comparison, or unchanged when none resolves.
 */
export function withDefaultComparison( params: ReportParams ): ReportParams {
	const comparison = getComparisonRangeFromPreset(
		{ from: localTZDate( params.from ), to: localTZDate( params.to ) },
		'previous-period',
		{ primaryPresetId: params.preset }
	);

	if ( ! comparison?.from || ! comparison.to ) {
		return params;
	}

	return {
		...params,
		compare_from: dateToISOStringWithLocalTZ( comparison.from ),
		compare_to: dateToISOStringWithLocalTZ( comparison.to ),
		compare_preset: 'previous-period',
		comp: '1',
	};
}

/**
 * Build report query parameters for the given preset, optionally with the
 * previous-period comparison range.
 */
export const getDefaultQueryParams = (
	withComparison: boolean = false,
	preset: PresetType = DEFAULT_PRESET
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

	return withComparison ? withDefaultComparison( params ) : params;
};
