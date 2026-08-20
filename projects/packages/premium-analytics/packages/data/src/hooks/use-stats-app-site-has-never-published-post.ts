/**
 * Internal dependencies
 */
import { statsAppSiteHasNeverPublishedPostQuery } from '../queries/stats-app-site-has-never-published-post-query';
import { useStatsAppQuery, type UseStatsAppOptions } from './use-stats-app-query';
import type { StatsAppSiteHasNeverPublishedPostParams } from '../queries/stats-app-site-has-never-published-post-query';

export type {
	StatsAppSiteHasNeverPublishedPostParams,
	StatsAppSiteHasNeverPublishedPostResponse,
} from '../queries/stats-app-site-has-never-published-post-query';

export function useStatsAppSiteHasNeverPublishedPost(
	params: StatsAppSiteHasNeverPublishedPostParams,
	options?: UseStatsAppOptions
) {
	return useStatsAppQuery( statsAppSiteHasNeverPublishedPostQuery( params ), options );
}
