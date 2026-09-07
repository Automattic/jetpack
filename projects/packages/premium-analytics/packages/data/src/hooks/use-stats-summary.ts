/**
 * Internal dependencies
 */
import { statsSummaryQuery } from '../queries/stats-summary-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsSummaryParams, StatsSummaryResponse } from '../queries/stats-summary-query';

export type { StatsSummaryParams, StatsSummaryResponse } from '../queries/stats-summary-query';

export function useStatsSummary( params: StatsSummaryParams, options?: UseStatsOptions ) {
	return useStatsReport< StatsSummaryParams, StatsSummaryResponse >(
		statsSummaryQuery,
		params,
		'summary',
		options
	);
}
