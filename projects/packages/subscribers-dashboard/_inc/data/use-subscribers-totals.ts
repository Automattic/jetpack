import { useQuery } from '@tanstack/react-query';
import { fetchSubscribersTotals } from './api';
import type { SubscribersTotals } from './types';

const defaultTotals: SubscribersTotals = {
	total_subscribers: 0,
	email_subscribers: 0,
	paid_subscribers: 0,
	social_followers: 0,
};

export const SUBSCRIBERS_TOTALS_QUERY_KEY = [ 'subscribers-totals' ] as const;

type State = {
	data: SubscribersTotals;
	isLoading: boolean;
	error: string | null;
};

/**
 * Subscriber totals hook backed by React Query.
 *
 * @return Loading state, totals, and error string.
 */
export function useSubscribersTotals(): State {
	const query = useQuery( {
		queryKey: SUBSCRIBERS_TOTALS_QUERY_KEY,
		queryFn: async () => {
			const response = await fetchSubscribersTotals();
			return response.counts ?? defaultTotals;
		},
	} );

	return {
		data: query.data ?? defaultTotals,
		isLoading: query.isLoading,
		error: query.error?.message ?? null,
	};
}
