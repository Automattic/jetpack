/**
 * Internal dependencies
 */
import { statsPublicizeQuery } from '../queries/stats-publicize-query';
import { useStatsQuery } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';
import type {
	StatsPublicizeParams,
	StatsPublicizeResponse,
} from '../queries/stats-publicize-query';

export type {
	StatsPublicizeParams,
	StatsPublicizeResponse,
} from '../queries/stats-publicize-query';

export function useStatsPublicize( params: StatsPublicizeParams = {}, options?: UseStatsOptions ) {
	return useStatsQuery< StatsPublicizeResponse >( statsPublicizeQuery( params ), options );
}
