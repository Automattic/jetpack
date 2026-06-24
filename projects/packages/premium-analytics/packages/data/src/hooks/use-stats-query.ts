import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { UseStatsOptions } from './use-stats-report';

export function useStatsQuery< TData = unknown >(
	queryOptions: UseQueryOptions< TData >,
	options?: UseStatsOptions
) {
	const enabled =
		options?.enabled === undefined
			? queryOptions.enabled
			: options.enabled && queryOptions.enabled !== false;

	return useQuery( { ...queryOptions, enabled } );
}
