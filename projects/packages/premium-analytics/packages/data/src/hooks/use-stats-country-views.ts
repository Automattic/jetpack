/**
 * Internal dependencies
 */
import { statsCountryViewsQuery } from '../queries/stats-country-views-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsCountryViews( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport( statsCountryViewsQuery, params, 'country-views', options );
}
