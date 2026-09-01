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
import { getStoreInfo } from './store-info';

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

	const { from: fromString, to: toString } = range;

	const interval = getDefaultIntervalForPeriod( preset, fromString, toString );

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
