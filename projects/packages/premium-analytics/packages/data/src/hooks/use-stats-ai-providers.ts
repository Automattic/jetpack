/**
 * Internal dependencies
 */
import { statsAiProvidersQuery } from '../queries/stats-ai-providers-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsAiProvidersReport } from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';
import type { ReportParams } from '../utils/search';

export { isAiProvidersRangeTooLong } from '../queries/stats-ai-providers-query';

export function useStatsAiProviders( params: ReportParams, options?: UseStatsOptions ) {
	return useStatsReport< StatsReportParams, StatsAiProvidersReport >(
		statsAiProvidersQuery,
		params,
		'ai-providers',
		options
	);
}
