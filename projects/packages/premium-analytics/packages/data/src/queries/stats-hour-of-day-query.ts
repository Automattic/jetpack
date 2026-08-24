/**
 * External dependencies
 */
import { getDatePart } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { getDaysBetweenInclusive } from '../utils/interval';
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';
import type { StatsQueryParams } from '../utils/stats-params';

export type StatsHourOfDayParams = StatsReportParams;

/**
 * Maximum inclusive range; longer requests return 400 instead of being clamped.
 */
const HOUR_OF_DAY_MAX_DAYS = 366;

/**
 * Query views grouped into 24 site-local hour-of-day buckets.
 */
export const statsHourOfDayQuery = (
	params: StatsHourOfDayParams
): StatsReportQueryOptions< 'hourOfDay' > => {
	// This endpoint counts bare calendar dates when enforcing its range limit.
	const date = getDatePart( params.end_date ?? params.date ?? params.to );
	const startDate = getDatePart( params.start_date ?? params.from );

	const range: StatsQueryParams = date ? { date } : {};

	if ( date && startDate && getDaysBetweenInclusive( startDate, date ) > HOUR_OF_DAY_MAX_DAYS ) {
		// The endpoint counts `days` back from `date` exactly as it would derive the
		// range from `start_date`, so ask it for the cap rather than shortening the
		// start ourselves.
		range.days = HOUR_OF_DAY_MAX_DAYS;
	} else if ( startDate ) {
		range.start_date = startDate;
	}

	return statsProxyQuery( {
		name: 'hourOfDay',
		version: '1.1',
		endpoint: 'stats/views-by/hour-of-day',
		params: range,
		sanitizer: 'hourOfDay',
		enabled: !! date,
	} );
};
