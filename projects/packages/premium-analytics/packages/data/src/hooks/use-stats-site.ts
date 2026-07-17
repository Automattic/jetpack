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

export function useStatsSite( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useQuery( { ...statsSiteQuery( params ), enabled: options?.enabled ?? true } );
}
