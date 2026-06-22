/**
 * Internal dependencies
 */
import { statsAppSiteHasNeverPublishedPostQuery } from '../queries/stats-app-site-has-never-published-post-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';
import type { StatsQueryParams } from '../utils/stats-params';

export function useStatsAppSiteHasNeverPublishedPost(
	params?: StatsQueryParams,
	options?: UseStatsAppOptions
) {
	return useStatsAppQuery( statsAppSiteHasNeverPublishedPostQuery( params ), options );
}
