/**
 * External dependencies
 */
import { getComparisonRangeFromPreset } from '@jetpack-premium-analytics/datetime';
import { differenceInCalendarDays, startOfDay } from 'date-fns';
/**
 * Internal dependencies
 */
import {
	localTZDate,
	dateToISOStringWithLocalTZ,
	getDefaultIntervalForPeriod,
	computeDateRangeFromPreset,
	type PresetType,
	type ReportParams,
} from '../utils';

const DEFAULT_PRESET: PresetType = 'last-30-days';

/**
 * Pick the default date-range preset based on how long
 * the store has been live.
 *
 * - Not launched / unknown → last-30-days (safe default)
 * - Launched today         → today
 * - Launched ≤ 7 days ago  → last-7-days
 * - Launched > 7 days ago  → last-30-days
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
 * Build report query parameters (from, to, interval, preset)
 * for the given date-range preset. Defaults to `last-30-days`.
 *
 * Callers that need a dynamic default (e.g. based on store
 * age) should resolve the preset externally and pass it in.
 */
export const getDefaultQueryParams = (
	/**
	 * Include previous-period comparison range.
	 */
	withComparison: boolean = false,

	/**
	 * Date-range preset. Defaults to `last-30-days`.
	 */
	preset: PresetType = DEFAULT_PRESET
): ReportParams => {
	const range = computeDateRangeFromPreset( preset );

	if ( ! range ) {
		throw new Error( `Unknown preset: ${ preset }` );
	}

	const { from: fromString, to: toString } = range;

	const interval = getDefaultIntervalForPeriod( undefined, fromString, toString );

	if ( ! withComparison ) {
		return {
			from: fromString,
			to: toString,
			preset,
			interval,
		};
	}

	const from = localTZDate( new Date( fromString ) );
	const to = localTZDate( new Date( toString ) );

	const comparisonParams = getComparisonRangeFromPreset(
		{
			from,
			to,
		},
		'previous-period'
	);

	return {
		from: fromString,
		to: toString,
		preset,
		interval,
		compare_from: comparisonParams?.from
			? dateToISOStringWithLocalTZ( comparisonParams?.from )
			: undefined,
		compare_to: comparisonParams?.to
			? dateToISOStringWithLocalTZ( comparisonParams?.to )
			: undefined,
		compare_preset: 'previous-period',
		comp: '1',
	};
};
