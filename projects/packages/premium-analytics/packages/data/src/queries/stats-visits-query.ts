/**
 * Internal dependencies
 */
import { reportParamsToStatsQueryParams, statsQueryParamsToApiParams } from '../utils/stats-params';
import { statsProxyQuery, type StatsReportParams } from './stats-query';
import type { StatsProxyParams } from '../api';

type StatsVisitsParams = StatsReportParams & {
	stat_fields?: string;
};

export const statsVisitsQuery = ( params: StatsVisitsParams ) => {
	const statsParams = reportParamsToStatsQueryParams( params );
	const apiParams = statsQueryParamsToApiParams( statsParams );
	const visitsParams: StatsProxyParams = {
		unit: apiParams.period,
		date: apiParams.date,
		start_date: apiParams.start_date,
		quantity: apiParams.days,
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
