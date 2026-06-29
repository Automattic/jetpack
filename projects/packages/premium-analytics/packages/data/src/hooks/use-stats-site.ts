/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
/**
 * Internal dependencies
 */
import { statsSiteQuery } from '../queries/stats-site-query';
import type { UseStatsOptions } from './use-stats-report';
import type { sanitizeStatsSiteResponse } from '../processing/stats';
import type { StatsQueryParams } from '../utils/stats-params';
import type { UseQueryResult } from '@tanstack/react-query';

export function useStatsSite(
	params?: StatsQueryParams,
	options?: UseStatsOptions
): UseQueryResult< ReturnType< typeof sanitizeStatsSiteResponse > > {
	return useQuery( { ...statsSiteQuery( params ), enabled: options?.enabled ?? true } );
}
