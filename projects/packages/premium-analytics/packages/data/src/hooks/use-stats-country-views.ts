/**
 * Internal dependencies
 */
import { statsCountryViewsQuery } from '../queries/stats-country-views-query';
import { useStatsReport } from './use-stats-report';
import type { UseReportResult } from './use-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsLocationsItem, StatsNormalizedReport } from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsCountryViews(
	params: StatsReportParams,
	options?: UseStatsOptions
): UseReportResult< StatsNormalizedReport< StatsLocationsItem > > {
	return useStatsReport( statsCountryViewsQuery, params, 'country-views', options );
}
