import { useQuery } from '@tanstack/react-query';
import { fetchSubscribers } from './api';
import type { SubscribersQueryParams, SubscribersResponse } from './types';

/**
 * Build a stable React Query key for the subscribers list query. Mutations call
 * `queryClient.invalidateQueries({ queryKey: ['subscribers'] })` to refetch.
 *
 * @param params - Query params.
 * @return Cache key.
 */
export function getSubscribersQueryKey( params: SubscribersQueryParams ): readonly unknown[] {
	return [
		'subscribers',
		params.page,
		params.perPage,
		params.sort,
		params.sortOrder,
		params.search ?? '',
		[ ...params.filters ].sort().join( ',' ),
	];
}

type State = {
	data: SubscribersResponse | undefined;
	isLoading: boolean;
	error: string | null;
};

/**
 * Subscribers list hook backed by React Query — keeps cached pages between filter / sort flips
 * and lets mutations invalidate the cache.
 *
 * @param params - List query params.
 * @return Loading state, response, and error string.
 */
export function useSubscribers( params: SubscribersQueryParams ): State {
	const query = useQuery< SubscribersResponse, Error >( {
		queryKey: getSubscribersQueryKey( params ),
		queryFn: () => fetchSubscribers( params ),
		placeholderData: previous => previous,
	} );

	return {
		data: query.data,
		isLoading: query.isLoading,
		error: query.error?.message ?? null,
	};
}
