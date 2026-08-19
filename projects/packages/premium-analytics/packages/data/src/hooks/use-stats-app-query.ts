import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { getStatsQueryEnabled } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';

export type UseStatsAppOptions = UseStatsOptions;

export function useStatsAppQuery< TData = unknown >(
	queryOptions: UseQueryOptions< TData >,
	options?: UseStatsAppOptions
) {
	return useQuery( {
		...queryOptions,
		enabled: getStatsQueryEnabled( queryOptions, options ),
	} );
}
