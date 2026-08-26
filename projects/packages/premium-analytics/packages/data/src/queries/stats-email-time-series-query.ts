/**
 * External dependencies
 */
import { readSiteTimestamp } from '@jetpack-premium-analytics/datetime';
/**
 * Internal dependencies
 */
import { reportParamsToStatsQueryParams } from '../utils/stats-params';
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

export type StatsEmailTimeSeriesPeriod = 'hour' | 'day';

export type StatsEmailTimeSeriesParams = StatsReportParams;

const hasValidPostId = ( postId: number ) => Number.isInteger( postId ) && postId > 0;

// The email timeline only supports hourly and daily buckets (Calypso's validEmailPeriods),
// so any coarser dashboard interval collapses to daily.
const toEmailPeriod = ( period?: string ): StatsEmailTimeSeriesPeriod =>
	period === 'hour' ? 'hour' : 'day';

// The wall-clock hour a window's end names, read by the datetime package's
// single timestamp reader so it cannot disagree with the sanitizer's trim
// bounds, then narrowed the same way (T-separated only — getDatePart, which
// derives `days`, splits on T alone); a bare date, or anything the reader
// rejects or the pipeline can't carry, ends at hour 23 as before.
const endHourOfDay = ( value?: string ): number => {
	const timestamp = typeof value === 'string' ? readSiteTimestamp( value ) : null;

	return timestamp?.isValid && ! timestamp.value.includes( ' ' ) && timestamp.value.includes( 'T' )
		? timestamp.parts[ 3 ]
		: 23;
};

// Mirror Calypso's requestEmailStats: the timeline is period-scoped and always sends period,
// quantity, date, and stats_fields=timeline. Unlike the other stats endpoints (where `date`
// is the window's END), the email timeline reads `date` as the window's START and returns
// `quantity` buckets going forward — one per day, or 24 per day for hourly. The endpoint
// resolves `date` to its calendar day and anchors hourly buckets on that day's midnight
// regardless of the time of day it carries (verified against production), so a mid-day
// window needs buckets from that midnight through the window's end hour, and the leading
// out-of-window buckets are trimmed off by the sanitizer via the window in sanitizerParams.
function emailTimeSeriesQuery(
	statType: 'opens' | 'clicks',
	postId: number,
	params: StatsReportParams
): StatsReportQueryOptions< 'emailTimeSeries' > {
	const statsParams = reportParamsToStatsQueryParams( params );
	const period = toEmailPeriod( statsParams.period );
	const days = statsParams.days ?? ( period === 'hour' ? 1 : 30 );
	const emailParams: StatsProxyParams = {
		period,
		quantity:
			period === 'hour'
				? Math.max( 1, 24 * ( days - 1 ) + endHourOfDay( statsParams.end_date ) + 1 )
				: days,
		...( statsParams.start_date ? { date: statsParams.start_date } : {} ),
		stats_fields: 'timeline',
	};

	return statsProxyQuery( {
		name: `email-${ statType }-time-series`,
		version: '1.1',
		endpoint: `stats/${ statType }/emails/${ postId }`,
		params: emailParams,
		sanitizer: 'emailTimeSeries',
		...( statsParams.start_date && statsParams.end_date
			? {
					sanitizerParams: {
						window_start: statsParams.start_date,
						window_end: statsParams.end_date,
					},
			  }
			: {} ),
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
