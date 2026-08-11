/**
 * External dependencies
 */
import { getDatePart } from '@jetpack-premium-analytics/datetime';
import {
	differenceInCalendarISOWeeks,
	differenceInCalendarMonths,
	differenceInCalendarYears,
	differenceInHours,
} from 'date-fns';
/**
 * Internal dependencies
 */
import { localTZDate } from './date';
import { getDaysBetweenInclusive } from './interval';
import type { ReportParams } from './search';
import type { StatsProxyParams } from '../api/stats-proxy-fetch';

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
 * Count the number of `period` buckets spanning a date range, inclusive of both
 * ends. Used to translate a dashboard date range into the `quantity` param that
 * quantity-based Stats endpoints (e.g. `stats/subscribers`) expect for the given
 * `unit`, mirroring how `days` is derived for day-based requests.
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
	// Hourly is the one granularity finer than the calendar day the other
	// branches key on, so it diffs the instants themselves. A range ending at
	// `23:59:59` is a second short of the full span, hence the inclusive `+ 1`.
	if ( period === 'hour' ) {
		const hours = differenceInHours( localTZDate( to ), localTZDate( from ) );

		return Number.isNaN( hours ) || hours < 0 ? 1 : hours + 1;
	}

	if ( period === 'day' ) {
		return getDaysBetweenInclusive( from, to );
	}

	// Anchor both dates in UTC before diffing: the calendar-diff functions read
	// their arguments' local getters, and a plain UTC-tagged `Date`'s getters
	// reflect the machine's local timezone, not UTC. Left unanchored, a
	// negative-offset machine can read a UTC midnight instant that lands
	// exactly on a week/month/year boundary as the previous local period,
	// shifting only one side of the range and skewing the bucket count (e.g.
	// a 4-week range reading as 5 weeks).
	const fromDate = localTZDate( `${ getDatePart( from ) }T00:00:00Z`, '+00:00' );
	const toDate = localTZDate( `${ getDatePart( to ) }T00:00:00Z`, '+00:00' );

	const differenceForPeriod = {
		week: differenceInCalendarISOWeeks,
		month: differenceInCalendarMonths,
		year: differenceInCalendarYears,
	}[ period ];

	const diff = differenceForPeriod( toDate, fromDate );

	if ( Number.isNaN( diff ) || diff < 0 ) {
		return 1;
	}

	return diff + 1;
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
