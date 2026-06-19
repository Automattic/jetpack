/**
 * Internal dependencies
 */
import { useStatsReport } from './use-stats-report';
import { statsCountryViewsQuery } from '../queries/stats-country-views-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsCountryViews( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsCountryViewsQuery,
		params,
		[ 'stats', 'country-views', '__comparison__', 'disabled' ],
		options
	);
}
