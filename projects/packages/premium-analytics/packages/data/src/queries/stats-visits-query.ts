/**
 * Internal dependencies
 */
import {
	getPeriodsBetweenInclusive,
	reportParamsToStatsQueryParams,
	statsQueryParamsToApiParams,
} from '../utils/stats-params';
import {
	statsProxyQuery,
	type StatsReportParams,
	type StatsReportQueryOptions,
} from './stats-query';
import type { StatsProxyParams } from '../api';
import type { StatsTimeSeriesReport } from '../processing/stats';

export type StatsVisitsStatField = 'views' | 'visitors' | 'likes' | 'comments' | 'post_titles';

export type StatsVisitsStatFields =
	| StatsVisitsStatField
	| `${ StatsVisitsStatField },${ StatsVisitsStatField }`
	| `${ StatsVisitsStatField },${ StatsVisitsStatField },${ StatsVisitsStatField }`
	| `${ StatsVisitsStatField },${ StatsVisitsStatField },${ StatsVisitsStatField },${ StatsVisitsStatField }`
	| `${ StatsVisitsStatField },${ StatsVisitsStatField },${ StatsVisitsStatField },${ StatsVisitsStatField },${ StatsVisitsStatField }`;

export type StatsVisitsParams = StatsReportParams & {
	stat_fields?: StatsVisitsStatFields;
};

export type StatsVisitsResponse = StatsTimeSeriesReport;

export const statsVisitsQuery = (
	params: StatsVisitsParams
): StatsReportQueryOptions< 'visits' > => {
	const statsParams = reportParamsToStatsQueryParams( params );
	const apiParams = statsQueryParamsToApiParams( statsParams );
	// The endpoint returns its own default number of buckets unless the request
	// says how many the range spans. `days` already carries the daily count, so
	// only the hourly one is derived — and only when hourly is what's asked for.
	const hourlyQuantity = () =>
		statsParams.start_date && statsParams.end_date
			? getPeriodsBetweenInclusive( 'hour', statsParams.start_date, statsParams.end_date )
			: undefined;
	const quantity = apiParams.period === 'hour' ? hourlyQuantity() : apiParams.days;
	const visitsParams: StatsProxyParams = {
		unit: apiParams.period,
		date: apiParams.date,
		start_date: apiParams.start_date,
		...( apiParams.period === 'day' || apiParams.period === 'hour' ? { quantity } : {} ),
		stat_fields: params.stat_fields ?? 'views,visitors',
	};

	return statsProxyQuery( {
		name: 'visits',
		version: '1.1',
		endpoint: 'stats/visits',
		params: visitsParams,
		sanitizer: 'visits',
		enabled: !! ( visitsParams.date || visitsParams.start_date ),
	} );
};
