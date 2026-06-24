/**
 * Internal dependencies
 */
import { statsSearchTermsQuery } from '../queries/stats-search-terms-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsReportParams } from '../queries/stats-query';

export function useStatsSearchTerms( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport( statsSearchTermsQuery, params, 'search-terms', options );
}
