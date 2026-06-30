/**
 * Internal dependencies
 */
import { statsProxyQuery } from './stats-query';
import type { StatsReportQueryOptions } from './stats-query';
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

export type StatsEmailTimeSeriesParams = {
	period?: StatsEmailTimeSeriesPeriod;
	date?: string;
	quantity?: number;
};

const hasValidPostId = ( postId: number ) => Number.isInteger( postId ) && postId > 0;

// Mirror Calypso's requestEmailStats: the timeline is period-scoped and always sends
// period, quantity (24 for hour, 30 otherwise), and stats_fields=timeline.
function emailTimeSeriesApiParams( {
	period = 'day',
	date,
	quantity,
}: StatsEmailTimeSeriesParams ) {
	return {
		period,
		quantity: quantity ?? ( period === 'hour' ? 24 : 30 ),
		...( date ? { date } : {} ),
		stats_fields: 'timeline' as const,
	};
}

export const statsEmailOpensTimeSeriesQuery = (
	postId: number,
	params: StatsEmailTimeSeriesParams = {}
): StatsReportQueryOptions< 'emailTimeSeries' > =>
	statsProxyQuery( {
		name: 'email-opens-time-series',
		version: '1.1',
		endpoint: `stats/opens/emails/${ postId }`,
		params: emailTimeSeriesApiParams( params ),
		sanitizer: 'emailTimeSeries',
		enabled: hasValidPostId( postId ),
	} );

export const statsEmailClicksTimeSeriesQuery = (
	postId: number,
	params: StatsEmailTimeSeriesParams = {}
): StatsReportQueryOptions< 'emailTimeSeries' > =>
	statsProxyQuery( {
		name: 'email-clicks-time-series',
		version: '1.1',
		endpoint: `stats/clicks/emails/${ postId }`,
		params: emailTimeSeriesApiParams( params ),
		sanitizer: 'emailTimeSeries',
		enabled: hasValidPostId( postId ),
	} );
