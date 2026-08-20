import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { withAwaitedDataLoading } from './awaiting-data';
import { getStatsQueryEnabled, isStatsQueryLive } from './use-stats-query';
import type { UseStatsOptions } from './use-stats-report';

export type UseStatsAppOptions = UseStatsOptions;

export function useStatsAppQuery< TData = unknown >(
	queryOptions: UseQueryOptions< TData >,
	options?: UseStatsAppOptions
) {
	return withAwaitedDataLoading(
		useQuery( {
			...queryOptions,
			enabled: getStatsQueryEnabled( queryOptions, options ),
		} ),
		isStatsQueryLive( queryOptions, options )
	);
}
