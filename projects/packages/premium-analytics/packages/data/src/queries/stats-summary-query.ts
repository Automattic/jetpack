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

export type { StatsSummaryResponse } from '../processing/stats';

export type StatsSummaryParams = StatsReportParams;

/**
 * Builds the `stats/summary` proxy query for a dashboard date range.
 *
 * The summary endpoint aggregates the last `num` periods ending at `date`, so a
 * date range is expressed as `period=day` with `num` equal to the number of days
 * in the range (inclusive). The comparison period is fetched by `useReport`,
 * which re-invokes this factory with the compare window swapped into `from`/`to`,
 * so the date-range conversion stays here rather than in the widget.
 *
 * @param params - Report params carrying the dashboard date range.
 * @return The query options for the summary report.
 */
export const statsSummaryQuery = (
	params: StatsSummaryParams
): StatsReportQueryOptions< 'summary' > => {
	const statsParams = reportParamsToStatsQueryParams( params );
	const apiParams = statsQueryParamsToApiParams( statsParams );
	const summaryParams: StatsProxyParams = {
		period: 'day',
		date: apiParams.date,
		num: statsParams.days ?? 1,
	};

	return statsProxyQuery( {
		name: 'summary',
		version: '1.1',
		endpoint: 'stats/summary',
		params: summaryParams,
		sanitizer: 'summary',
		enabled: !! apiParams.date,
	} );
};
