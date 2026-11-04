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
 * The all-time site summary. Pass `stat_fields` with the `stats` keys you read: without it WPCOM
 * also computes the share counts, which take minutes on sites with many shares.
 *
 * @param params  - Query params, e.g. `{ stat_fields: 'views,visitors' }`.
 * @param options - Query options.
 * @return The summary query.
 */
export function useStatsSite( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useQuery( { ...statsSiteQuery( params ), enabled: options?.enabled ?? true } );
}
