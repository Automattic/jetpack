/**
 * Internal dependencies
 */
import { statsVisitsQuery } from '../queries/stats-visits-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsVisitsParams, StatsVisitsResponse } from '../queries/stats-visits-query';

export type {
	StatsVisitsParams,
	StatsVisitsResponse,
	StatsVisitsStatField,
	StatsVisitsStatFields,
} from '../queries/stats-visits-query';

export function useStatsVisits( params: StatsVisitsParams, options?: UseStatsOptions ) {
	return useStatsReport< StatsVisitsParams, StatsVisitsResponse >(
		statsVisitsQuery,
		params,
		[ 'stats', 'visits', '__comparison__', 'disabled' ],
		options
	);
}
