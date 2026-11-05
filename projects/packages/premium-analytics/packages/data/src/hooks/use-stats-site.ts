/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
/**
 * Internal dependencies
 */
import { statsSiteQuery } from '../queries/stats-site-query';
import type { UseStatsOptions } from './use-stats-report';
import type { StatsQueryParams } from '../utils/stats-params';

/**
 * The all-time site summary. Pass `stat_fields: STATS_SITE_SUMMARY_FIELDS` unless you need the share counts.
 *
 * @param params  - Query params.
 * @param options - Query options.
 * @return The summary query.
 */
export function useStatsSite( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useQuery( { ...statsSiteQuery( params ), enabled: options?.enabled ?? true } );
}
