/**
 * External dependencies
 */
import { getDatePart } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { toStatsBucketWindowParams, windowEndHour } from '../processing/stats';
import { reportParamsToStatsQueryParams, type StatsQueryParams } from '../utils/stats-params';
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';
import type { StatsProxyParams } from '../api';
import type {
	StatsEmailTimeSeriesDataPoint,
	StatsEmailTimeSeriesReport,
	StatsEmailTimeSeriesSummary,
} from '../processing/stats';

export type {
	StatsEmailTimeSeriesDataPoint,
	StatsEmailTimeSeriesReport,
	StatsEmailTimeSeriesSummary,
};

export type StatsEmailTimeSeriesPeriod = 'hour' | 'day' | 'month';

export type StatsEmailTimeSeriesParams = StatsReportParams;

/**
 * The most buckets the email timeline endpoint returns per request, whatever
 * their size; asked for more, it falls back to its own default count.
 */
export const EMAIL_TIME_SERIES_MAX_BUCKETS = 30;

const hasValidPostId = ( postId: number ) => Number.isInteger( postId ) && postId > 0;

// The email timeline buckets by hour, day, month or year, never by week
// (WOOA7S-2067), so a weekly dashboard interval collapses to daily for the
// widget to aggregate; yearly is never asked for.
const toEmailPeriod = ( period?: string ): StatsEmailTimeSeriesPeriod =>
	period === 'hour' || period === 'month' ? period : 'day';

// Hourly buckets are anchored on the start day's midnight whatever time `date`
// carries, so the request must span it; the sanitizer trims the leading ones.
const hourlyQuantity = ( days: number, endDate?: string ) =>
	Math.max( 1, 24 * ( days - 1 ) + windowEndHour( endDate ) + 1 );

// Monthly buckets are asked for from the first of the start month, as the
// legacy email chart did, and counted by calendar month through the end.
const firstOfMonth = ( date: string ) => `${ date.slice( 0, 7 ) }-01`;
const monthlyQuantity = ( startDate: string, endDate: string ) => {
	const [ startYear, startMonth ] = startDate.split( '-' ).map( Number );
	const [ endYear, endMonth ] = endDate.split( '-' ).map( Number );

	return Math.min(
		EMAIL_TIME_SERIES_MAX_BUCKETS,
		Math.max( 1, ( endYear - startYear ) * 12 + ( endMonth - startMonth ) + 1 )
	);
};

// The request's bucket size, count and start for a window. Mirrors Calypso's
// requestEmailStats. Unlike the other stats endpoints (where `date` is the
// window's END), this one reads `date` as the window's START and returns
// `quantity` buckets going forward.
function emailTimelineParams( statsParams: StatsQueryParams ) {
	const period = toEmailPeriod( statsParams.period );
	const days = statsParams.days ?? ( period === 'hour' ? 1 : 30 );
	const startDay = getDatePart( statsParams.start_date );
	const endDay = getDatePart( statsParams.end_date );

	if ( period === 'month' && startDay && endDay ) {
		return {
			period,
			quantity: monthlyQuantity( startDay, endDay ),
			date: firstOfMonth( startDay ),
		};
	}

	return {
		period: period === 'hour' ? period : 'day',
		quantity: period === 'hour' ? hourlyQuantity( days, statsParams.end_date ) : days,
		...( statsParams.start_date ? { date: statsParams.start_date } : {} ),
	};
}

function emailTimeSeriesQuery(
	statType: 'opens' | 'clicks',
	postId: number,
	params: StatsReportParams
): StatsReportQueryOptions< 'emailTimeSeries' > {
	const statsParams = reportParamsToStatsQueryParams( params );
	const timeline = emailTimelineParams( statsParams );
	const emailParams: StatsProxyParams = { ...timeline, stats_fields: 'timeline' };
	const window = toStatsBucketWindowParams( statsParams );
	// The sanitizer clips the edge months to the window, so it needs the window
	// itself: `date` alone names the first month, which would clip every month to it.
	const sanitizerParams =
		timeline.period === 'month'
			? { ...window, start_date: statsParams.start_date, end_date: statsParams.end_date }
			: window;

	return statsProxyQuery( {
		name: `email-${ statType }-time-series`,
		version: '1.1',
		endpoint: `stats/${ statType }/emails/${ postId }`,
		params: emailParams,
		sanitizer: 'emailTimeSeries',
		windowEnd: statsParams.end_date ?? null,
		...( sanitizerParams ? { sanitizerParams } : {} ),
		enabled: hasValidPostId( postId ) && !! emailParams.date,
	} );
}

export const statsEmailOpensTimeSeriesQuery = (
	postId: number,
	params: StatsReportParams
): StatsReportQueryOptions< 'emailTimeSeries' > => emailTimeSeriesQuery( 'opens', postId, params );

export const statsEmailClicksTimeSeriesQuery = (
	postId: number,
	params: StatsReportParams
): StatsReportQueryOptions< 'emailTimeSeries' > => emailTimeSeriesQuery( 'clicks', postId, params );
