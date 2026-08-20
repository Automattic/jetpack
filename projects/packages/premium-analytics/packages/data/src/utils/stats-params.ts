/**
 * External dependencies
 */
import { getDatePart } from '@jetpack-premium-analytics/datetime';
import {
	differenceInCalendarISOWeeks,
	differenceInCalendarMonths,
	differenceInCalendarYears,
	differenceInMilliseconds,
} from 'date-fns';
/**
 * Internal dependencies
 */
import { localTZDate } from './date';
import { getDaysBetweenInclusive } from './interval';
import type { ReportParams } from './search';
import type { StatsProxyParams } from '../api/stats-proxy-fetch';

const MS_PER_HOUR = 60 * 60 * 1000;

export type StatsPeriod = 'hour' | 'day' | 'week' | 'month' | 'year';

export type StatsQueryParamFields = {
	period?: StatsPeriod | string;
	end_date?: string;
	date?: string;
	start_date?: string;
	days?: number;
	num?: number;
	max?: number;
	summarize?: number | boolean;
	complete_stats?: number | boolean;
	skip_archives?: number | boolean;
};

export type StatsQueryParams = StatsProxyParams & StatsQueryParamFields;

type StatsQueryParamInput = Partial< ReportParams > & {
	[ key: string ]: unknown;
} & Partial< StatsQueryParamFields >;

const statsParamKeys = [
	'period',
	'end_date',
	'date',
	'start_date',
	'days',
	'num',
	'max',
	'summarize',
	'complete_stats',
	'skip_archives',
] as const satisfies Array< keyof StatsQueryParamFields >;

export function getStatsPeriodFromInterval( interval?: string ): StatsPeriod {
	switch ( interval ) {
		case 'hour':
			return 'hour';
		case 'week':
			return 'week';
		case 'month':
		case 'quarter':
			return 'month';
		case 'year':
			return 'year';
		case 'day':
		default:
			return 'day';
	}
}

/**
 * Count the hour buckets a range covers, from the span between its ends.
 *
 * Hour is the only unit whose ends carry precision finer than the unit itself,
 * so it is the only one that can land mid-bucket. Rounding the span up counts
 * the bucket a partial hour falls in, without adding one to a range that already
 * ends on the hour — the presets end at `23:59:59.999`, but a hand-edited or
 * deep-linked range need not.
 *
 * @param from - Range start.
 * @param to   - Range end.
 * @return The bucket count, at least 1.
 */
function countHourBuckets( from: string, to: string ): number {
	const span = differenceInMilliseconds( localTZDate( to ), localTZDate( from ) );

	return Number.isNaN( span ) || span <= 0 ? 1 : Math.ceil( span / MS_PER_HOUR );
}

/**
 * Count the buckets a range covers for a unit the calendar names, both ends
 * included.
 *
 * Both dates are anchored in UTC before diffing: the calendar-diff functions
 * read their arguments' local getters, and a plain UTC-tagged `Date`'s getters
 * reflect the machine's local timezone, not UTC. Left unanchored, a
 * negative-offset machine can read a UTC midnight instant that lands exactly on
 * a week/month/year boundary as the previous local period, shifting only one
 * side of the range and skewing the bucket count (e.g. a 4-week range reading
 * as 5 weeks).
 *
 * @param difference - The calendar diff for the unit.
 * @return A counter for that unit.
 */
function countCalendarBuckets( difference: ( to: Date, from: Date ) => number ) {
	return ( from: string, to: string ): number => {
		const fromDate = localTZDate( `${ getDatePart( from ) }T00:00:00Z`, '+00:00' );
		const toDate = localTZDate( `${ getDatePart( to ) }T00:00:00Z`, '+00:00' );

		const diff = difference( toDate, fromDate );

		return Number.isNaN( diff ) || diff < 0 ? 1 : diff + 1;
	};
}

/**
 * How each unit counts the buckets a range covers. One entry per unit, so a new
 * one is a new entry rather than another branch.
 */
const BUCKET_COUNTERS: Record< StatsPeriod, ( from: string, to: string ) => number > = {
	hour: countHourBuckets,
	day: getDaysBetweenInclusive,
	week: countCalendarBuckets( differenceInCalendarISOWeeks ),
	month: countCalendarBuckets( differenceInCalendarMonths ),
	year: countCalendarBuckets( differenceInCalendarYears ),
};

/**
 * Count the buckets a range covers at a given unit. Used to translate a
 * dashboard date range into the `quantity` param that quantity-based Stats
 * endpoints (e.g. `stats/subscribers`) expect, mirroring how `days` is derived
 * for day-based requests.
 *
 * @param period - The bucket granularity.
 * @param from   - Range start (`yyyy-MM-dd`, or a full ISO datetime).
 * @param to     - Range end (`yyyy-MM-dd`, or a full ISO datetime).
 * @return The bucket count, at least 1.
 */
export function getPeriodsBetweenInclusive(
	period: StatsPeriod,
	from: string,
	to: string
): number {
	return BUCKET_COUNTERS[ period ]( from, to );
}

export function reportParamsToStatsQueryParams(
	params: StatsQueryParamInput = {}
): StatsQueryParams {
	const statsParams = Object.fromEntries(
		statsParamKeys
			.filter( key => params[ key ] !== undefined && params[ key ] !== null )
			.map( key => [ key, params[ key ] ] )
	) as StatsQueryParams;

	const period = params.period ?? getStatsPeriodFromInterval( params.interval );
	// Stats v1.1 endpoints now resolve an offset-bearing ISO datetime to the
	// intended local calendar day (WOOA7S-1656/1664), so start_date/end_date
	// are passed through as-is instead of being trimmed to a bare date first.
	const endDate = params.end_date ?? params.date ?? params.to;
	const startDate = params.start_date ?? params.from;
	const days =
		params.days ??
		( startDate && endDate ? getDaysBetweenInclusive( startDate, endDate ) : undefined );

	return {
		...statsParams,
		period,
		...( endDate ? { end_date: endDate } : {} ),
		...( startDate ? { start_date: startDate } : {} ),
		...( days ? { days } : {} ),
	};
}

export function statsQueryParamsToApiParams( params: StatsQueryParams = {} ): StatsProxyParams {
	const { end_date: endDate, ...apiParams } = params;

	return {
		...apiParams,
		...( endDate ? { date: endDate } : {} ),
	};
}
