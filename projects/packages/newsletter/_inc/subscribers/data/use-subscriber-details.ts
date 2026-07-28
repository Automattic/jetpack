import { useQuery } from '@tanstack/react-query';
import {
	fetchSubscribedNewsletterCategories,
	fetchSubscriberDetails,
	fetchSubscriberStats,
} from './api';
import type { SubscribedNewsletterCategories, SubscriberDetails, SubscriberStats } from './types';

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

const NO_CATEGORIES: SubscribedNewsletterCategories = {
	enabled: false,
	newsletter_categories: [],
};

/**
 * Fetch the newsletter categories a single subscriber receives emails for.
 *
 * Errors resolve to "feature off" rather than rejecting, mirroring Calypso: WP.com 404s this route
 * when the subscriber has no subscription record on the blog, and older Jetpack versions have no
 * proxy for it at all. Neither is worth failing the whole detail panel over — the row simply hides.
 *
 * @param ids - Subscription / user ids.
 * @return React Query handle.
 */
export function useSubscribedNewsletterCategories( ids: Identifiers ) {
	const subscriptionId = ids.subscription_id ?? 0;
	const userId = ids.user_id ?? 0;
	const enabled = !! ( subscriptionId || userId );

	return useQuery< SubscribedNewsletterCategories, Error >( {
		queryKey: [ 'subscribed-newsletter-categories', subscriptionId, userId ],
		queryFn: () =>
			fetchSubscribedNewsletterCategories( {
				subscription_id: subscriptionId,
				user_id: userId,
			} ).catch( () => NO_CATEGORIES ),
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
