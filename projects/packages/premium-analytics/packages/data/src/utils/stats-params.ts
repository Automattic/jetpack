/**
 * External dependencies
 */
import {
	differenceInCalendarISOWeeks,
	differenceInCalendarMonths,
	differenceInCalendarYears,
} from 'date-fns';
/**
 * Internal dependencies
 */
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
] as const satisfies Array< keyof StatsQueryParamFields >;

function datePart( value?: string ) {
	return value?.split( 'T' )[ 0 ];
}

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
 * @param from   - Range start (`yyyy-MM-dd`).
 * @param to     - Range end (`yyyy-MM-dd`).
 * @return The bucket count, at least 1.
 */
export function getPeriodsBetweenInclusive(
	period: StatsPeriod,
	from: string,
	to: string
): number {
	if ( period === 'hour' || period === 'day' ) {
		return getDaysBetweenInclusive( from, to );
	}

	const fromDate = new Date( `${ datePart( from ) }T00:00:00Z` );
	const toDate = new Date( `${ datePart( to ) }T00:00:00Z` );

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

	const from = datePart( params.from );
	const to = datePart( params.to );
	const period = params.period ?? getStatsPeriodFromInterval( params.interval );
	const endDate = params.end_date ?? params.date ?? to;
	const startDate = params.start_date ?? from;
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
