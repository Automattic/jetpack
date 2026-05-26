import { useQuery } from '@tanstack/react-query';
import { fetchSubscriberDetails, fetchSubscriberStats } from './api';
import type { SubscriberDetails, SubscriberStats } from './types';

type Identifiers = {
	subscription_id?: number;
	user_id?: number;
};

/**
 * Fetch a single subscriber's profile. Disabled until at least one identifier is provided.
 *
 * @param ids - Subscription / user ids.
 * @return React Query handle.
 */
export function useSubscriberDetails( ids: Identifiers ) {
	const subscriptionId = ids.subscription_id ?? 0;
	const userId = ids.user_id ?? 0;
	const enabled = !! ( subscriptionId || userId );

	return useQuery< SubscriberDetails, Error >( {
		queryKey: [ 'subscriber-details', subscriptionId, userId ],
		queryFn: () => fetchSubscriberDetails( { subscription_id: subscriptionId, user_id: userId } ),
		enabled,
		placeholderData: previous => previous,
	} );
}

/**
 * Fetch a single subscriber's engagement stats.
 *
 * @param ids - Subscription / user ids.
 * @return React Query handle.
 */
export function useSubscriberStats( ids: Identifiers ) {
	const subscriptionId = ids.subscription_id ?? 0;
	const userId = ids.user_id ?? 0;
	const enabled = !! ( subscriptionId || userId );

	return useQuery< SubscriberStats, Error >( {
		queryKey: [ 'subscriber-stats', subscriptionId, userId ],
		queryFn: () => fetchSubscriberStats( { subscription_id: subscriptionId, user_id: userId } ),
		enabled,
		placeholderData: previous => previous,
	} );
}
