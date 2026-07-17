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

// Mirror Calypso's requestEmailStats: the timeline is period-scoped and always sends period,
// quantity, date, and stats_fields=timeline. Unlike the other stats endpoints (where `date`
// is the window's END), the email timeline reads `date` as the window's START and returns
// `quantity` buckets going forward, so it gets the range start and a quantity spanning the
// whole requested range — 24 buckets per day for hourly, one per day otherwise.
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
		quantity: period === 'hour' ? 24 * days : days,
		...( statsParams.start_date ? { date: statsParams.start_date } : {} ),
		stats_fields: 'timeline',
	};

	return statsProxyQuery( {
		name: `email-${ statType }-time-series`,
		version: '1.1',
		endpoint: `stats/${ statType }/emails/${ postId }`,
		params: emailParams,
		sanitizer: 'emailTimeSeries',
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
