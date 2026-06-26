/**
 * Internal dependencies
 */
import { statsUtmQuery } from '../queries/stats-utm-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsUtmParams, StatsUtmResponse } from '../queries/stats-utm-query';

export type { StatsUtmParams, StatsUtmResponse } from '../queries/stats-utm-query';

export function useStatsUtm( params: StatsUtmParams, options?: UseStatsOptions ) {
	return useStatsReport< StatsUtmParams, StatsUtmResponse >(
		statsUtmQuery,
		params,
		[ 'stats', 'utm', '__comparison__', 'disabled' ],
		options
	);
}
