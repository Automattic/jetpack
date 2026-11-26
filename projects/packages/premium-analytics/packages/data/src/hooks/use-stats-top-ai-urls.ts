/**
 * Internal dependencies
 */
import { statsTopAiUrlsQuery } from '../queries/stats-top-ai-urls-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsTopAiUrlsReport } from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';
import type { StatsTopAiUrlsParams } from '../queries/stats-top-ai-urls-query';

export type { StatsTopAiUrlsParams } from '../queries/stats-top-ai-urls-query';

export function useStatsTopAiUrls( params: StatsTopAiUrlsParams, options?: UseStatsOptions ) {
	return useStatsReport< StatsReportParams & StatsTopAiUrlsParams, StatsTopAiUrlsReport >(
		statsTopAiUrlsQuery,
		params,
		'top-ai-urls',
		options
	);
}
