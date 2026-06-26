/**
 * Internal dependencies
 */
import { statsPublicizeQuery } from '../queries/stats-publicize-query';
import { useStatsReport } from './use-stats-report';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsPublicizeParams } from '../queries/stats-publicize-query';

export type {
	StatsPublicizeParams,
	StatsPublicizeResponse,
} from '../queries/stats-publicize-query';

export function useStatsPublicize( params: StatsPublicizeParams = {}, options?: UseStatsOptions ) {
	return useStatsReport( statsPublicizeQuery, params, 'publicize', options );
}
