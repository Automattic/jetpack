/**
 * Internal dependencies
 */
import { statsTopAuthorsQuery } from '../queries/stats-top-authors-query';
import { useStatsReport } from './use-stats-report';
import type { UseReportResult } from './use-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsNormalizedReport, StatsTopAuthorsItem } from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsTopAuthors(
	params: StatsReportParams,
	options?: UseStatsOptions
): UseReportResult< StatsNormalizedReport< StatsTopAuthorsItem > > {
	return useStatsReport( statsTopAuthorsQuery, params, 'top-authors', options );
}
