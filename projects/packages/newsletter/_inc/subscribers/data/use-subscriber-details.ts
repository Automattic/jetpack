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
 * Whether a failed categories request means "there is nothing to show here" rather than "this
 * request failed". WP.com 404s the route when the subscriber has no subscription record on the
 * blog, and a Jetpack version without the proxy has no route at all — neither is retryable, and
 * neither is worth failing the whole detail panel over.
 *
 * @param error - Rejection from `apiFetch`.
 * @return True when the absence is expected.
 */
function isMissingCategoriesRecord( error: unknown ): boolean {
	const { code, data } = ( error ?? {} ) as { code?: string; data?: { status?: number } };
	return data?.status === 404 || code === 'rest_no_route';
}

/**
 * Fetch the newsletter categories a single subscriber receives emails for.
 *
 * An expected absence resolves to "feature off" so the row simply hides. Anything else — a 500, a
 * dropped connection — is left to reject, so React Query still retries it rather than caching a
 * transient failure as a successful "feature off" for the rest of the session. The row is hidden
 * either way; the difference is whether it can come back.
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
			} ).catch( error => {
				if ( isMissingCategoriesRecord( error ) ) {
					return NO_CATEGORIES;
				}
				throw error;
			} ),
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
