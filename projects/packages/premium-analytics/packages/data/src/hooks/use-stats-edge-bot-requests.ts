/**
 * Internal dependencies
 */
import { statsEdgeBotRequestsQuery } from '../queries/stats-edge-bot-requests-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsEdgeBotRequestsReport } from '../processing/stats';
import type { StatsEdgeBotRequestsParams } from '../queries/stats-edge-bot-requests-query';
import type { StatsReportParams } from '../queries/stats-query';

export type {
	StatsEdgeBotRequestsGranularity,
	StatsEdgeBotRequestsParams,
} from '../queries/stats-edge-bot-requests-query';

export function useStatsEdgeBotRequests(
	params: StatsEdgeBotRequestsParams,
	options?: UseStatsOptions
) {
	return useStatsReport< StatsReportParams & StatsEdgeBotRequestsParams, StatsEdgeBotRequestsReport >(
		statsEdgeBotRequestsQuery,
		params,
		'edge-bot-requests',
		options
	);
}
