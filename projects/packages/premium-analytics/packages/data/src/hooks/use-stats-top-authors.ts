/**
 * Internal dependencies
 */
import { useStatsReport } from './use-stats-report';
import { statsTopAuthorsQuery } from '../queries/stats-top-authors-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsTopAuthors( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsTopAuthorsQuery,
		params,
		[ 'stats', 'top-authors', '__comparison__', 'disabled' ],
		options
	);
}
