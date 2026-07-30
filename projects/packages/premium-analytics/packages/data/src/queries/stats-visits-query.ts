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
	const isHourly = apiParams.period === 'hour';
	// The hourly bucket endpoint reads `date`/`start_date` as full datetimes and derives the
	// bucket count from their span; by this point they're bare calendar dates (yyyy-MM-dd),
	// which the API resolves to 00:00:00 and silently truncates the last 23 hours of the range.
	// Span the whole start/end day explicitly so a one-day range still returns 24 buckets.
	const visitsParams: StatsProxyParams = {
		unit: apiParams.period,
		date: isHourly && apiParams.date ? `${ apiParams.date } 23:59:59` : apiParams.date,
		start_date:
			isHourly && apiParams.start_date
				? `${ apiParams.start_date } 00:00:00`
				: apiParams.start_date,
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
