/**
 * Internal dependencies
 */
import { statsAppSiteQuery } from '../queries/stats-app-site-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';

export type { StatsAppSiteResponse } from '../queries/stats-app-site-query';

export function useStatsAppSite( options?: UseStatsAppOptions ) {
	return useStatsAppQuery( statsAppSiteQuery(), options );
}
