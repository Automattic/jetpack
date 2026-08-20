import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { withAwaitedDataLoading } from './awaiting-data';
import type { UseStatsOptions } from './use-stats-report';

export function getStatsQueryEnabled< TData = unknown >(
	queryOptions: UseQueryOptions< TData >,
	options?: UseStatsOptions
) {
	return options?.enabled === false ? false : queryOptions.enabled;
}

/**
 * Whether a query is switched off outright, for `withAwaitedDataLoading`. See
 * `isAwaitingData`: a switched-off query has nothing coming, so the placeholder
 * it is left holding must not read as a load still in flight. `enabled` may also
 * be a predicate, which only React Query can resolve, so anything but a literal
 * `false` counts as live.
 *
 * @param queryOptions - The query's own options.
 * @param options      - The caller's options.
 * @return Whether the query can still fetch.
 */
export function isStatsQueryLive< TData = unknown >(
	queryOptions: UseQueryOptions< TData >,
	options?: UseStatsOptions
): boolean {
	return getStatsQueryEnabled( queryOptions, options ) !== false;
}

export function useStatsQuery< TData = unknown >(
	queryOptions: UseQueryOptions< TData >,
	options?: UseStatsOptions
) {
	return withAwaitedDataLoading(
		useQuery( {
			...queryOptions,
			enabled: getStatsQueryEnabled( queryOptions, options ),
		} ),
		isStatsQueryLive( queryOptions, options )
	);
}
