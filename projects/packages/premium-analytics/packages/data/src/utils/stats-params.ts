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
	// Sanitizer-only trim window (bucket-window.ts), sent via `sanitizerParams`
	// — deliberately absent from statsParamKeys so it can never reach a request.
	window_start?: string;
	window_end?: string;
	// Sanitizer-only, and stripped alongside the trim window: the zone the
	// report is normalized in, resolved once by `statsProxyQuery`.
	timezone?: string;
};

export type StatsQueryParams = StatsProxyParams & StatsQueryParamFields;

/** What a response sanitizer is handed: the request params, plus the report's zone. */
export type StatsSanitizerParams = StatsQueryParams & { timezone: string };

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
 * Hour is the only unit that can land mid-bucket, so the span is rounded up
 * rather than always adding a fixed +1 — a range already ending on the hour
 * (as the presets do) must not count an extra bucket.
 *
 * Ends must carry a time of day: unlike the calendar counters, this reads
 * them as instants, so a bare `yyyy-MM-dd` parses as midnight and undercounts
 * by a bucket-day (`2026-08-01` to `2026-08-07` reads as 144 hours, not 168).
 *
 * @param from - Range start, as a datetime.
 * @param to   - Range end, as a datetime.
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
 * read local getters, and an unanchored UTC-tagged `Date` reflects the
 * machine's local timezone — a negative-offset machine can misread a UTC
 * midnight boundary and skew the count (e.g. 4 weeks reading as 5).
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
 * Count the buckets a range covers at a given unit — the `quantity` param
 * that quantity-based Stats endpoints (e.g. `stats/subscribers`) expect,
 * mirroring how `days` is derived for day-based requests.
 *
 * @param period - The bucket granularity.
 * @param from   - Range start (date or datetime; `hour` requires a datetime,
 *               see `countHourBuckets`).
 * @param to     - Range end, same shapes and the same `hour` caveat.
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
	// Stats v1.1 resolves an offset-bearing ISO datetime to the local calendar
	// day (WOOA7S-1656/1664), so start_date/end_date pass through untrimmed.
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
	// window_start/window_end/timezone are sanitizer-only (see StatsQueryParamFields);
	// stripped here so a stray one can't leak into a request URL.
	const { end_date: endDate, ...apiParams } = params;

	delete apiParams.window_start;
	delete apiParams.window_end;
	delete apiParams.timezone;

	return {
		...apiParams,
		...( endDate ? { date: endDate } : {} ),
	};
}
