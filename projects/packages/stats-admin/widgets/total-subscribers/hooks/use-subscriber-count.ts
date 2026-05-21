/**
 * External dependencies
 */
import {
	fetchSubscriberCounts,
	mapSubscriberCountsFromResponse,
} from '@automattic/jetpack-shared-extension-utils/fetch-subscriber-counts';
import { useQuery } from '@tanstack/react-query';

export type SubscriberCounts = ReturnType< typeof mapSubscriberCountsFromResponse >;

const SUBSCRIBER_COUNTS_QUERY_KEY = [ 'jetpack', 'subscriber-counts' ] as const;

/**
 * Load subscriber totals for the current site (same source as membership-products).
 *
 * @return React Query result with email, paid, social, and total subscriber counts.
 */
export function useSubscriberCounts() {
	return useQuery( {
		queryKey: SUBSCRIBER_COUNTS_QUERY_KEY,
		queryFn: async () => {
			const response = await fetchSubscriberCounts();
			return mapSubscriberCountsFromResponse( response );
		},
		staleTime: 5 * 60 * 1000,
		retry: 1,
	} );
}

/**
 * Convenience hook for views that only need the total subscriber count.
 *
 * @return React Query result where `data` is the total subscriber count or null.
 */
export function useSubscriberCount() {
	const query = useSubscriberCounts();

	return {
		...query,
		data: typeof query.data?.totalSubscribers === 'number' ? query.data.totalSubscribers : null,
	};
}
