/**
 * Internal dependencies
 */
import { statsAiProvidersQuery } from '../queries/stats-ai-providers-query';
import { useEdgeScope, withEdgeScope } from './use-edge-scope';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsAiProvidersReport } from '../processing/stats';
import type { StatsReportParams } from '../queries/stats-query';
import type { ReportParams } from '../utils/search';

export { isAiProvidersRangeTooLong } from '../queries/stats-ai-providers-query';

export function useStatsAiProviders( params: ReportParams, options?: UseStatsOptions ) {
	const scope = useEdgeScope( params );
	const report = useStatsReport< StatsReportParams, StatsAiProvidersReport >(
		statsAiProvidersQuery,
		scope.params,
		'ai-providers',
		{ ...options, enabled: options?.enabled !== false && scope.isReady }
	);

	return withEdgeScope( report, scope );
}
