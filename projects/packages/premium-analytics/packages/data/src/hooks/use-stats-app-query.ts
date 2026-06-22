import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

export type UseStatsAppOptions = {
	enabled?: boolean;
};

export function useStatsAppQuery< TData = unknown >(
	queryOptions: UseQueryOptions< TData >,
	options?: UseStatsAppOptions
) {
	return useQuery( {
		...queryOptions,
		enabled: options?.enabled ?? true,
	} );
}
