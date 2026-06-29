import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import type { UseStatsOptions } from './use-stats-report';

export function getStatsQueryEnabled< TData = unknown >(
	queryOptions: UseQueryOptions< TData >,
	options?: UseStatsOptions
) {
	return options?.enabled === false ? false : queryOptions.enabled;
}

export function useStatsQuery< TData = unknown >(
	queryOptions: UseQueryOptions< TData >,
	options?: UseStatsOptions
): UseQueryResult< TData > {
	return useQuery( {
		...queryOptions,
		enabled: getStatsQueryEnabled( queryOptions, options ),
	} );
}
