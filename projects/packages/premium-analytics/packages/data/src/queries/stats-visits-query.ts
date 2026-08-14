/**
 * Internal dependencies
 */
import { reportParamsToStatsQueryParams, statsQueryParamsToApiParams } from '../utils/stats-params';
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
	const visitsParams: StatsProxyParams = {
		unit: apiParams.period,
		date: apiParams.date,
		start_date: apiParams.start_date,
		...( apiParams.period === 'day' ? { quantity: apiParams.days } : {} ),
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
