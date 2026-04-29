import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import type {
	RemoveSubscriberPayload,
	RemoveSubscriberResponse,
	SubscribersQueryParams,
	SubscribersResponse,
	SubscribersTotalsResponse,
} from './types';

/**
 * Fetch the paginated subscribers list from the Jetpack REST proxy
 * (`GET /wpcom/v2/subscribers/list`), which forwards to WP.com.
 *
 * @param params - Query params for the list request.
 * @return Subscribers response.
 */
export function fetchSubscribers( params: SubscribersQueryParams ): Promise< SubscribersResponse > {
	const queryArgs: Record< string, unknown > = {
		page: params.page,
		per_page: params.perPage,
		sort: params.sort,
		sort_order: params.sortOrder,
		use_new_helper: true,
	};

	if ( params.search ) {
		queryArgs.search = params.search;
	}

	const filters = params.filters?.length ? params.filters : [ 'all' ];

	const baseUrl = addQueryArgs( '/wpcom/v2/subscribers/list', queryArgs );
	const filterQuery = filters
		.map( filter => `filters[]=${ encodeURIComponent( filter ) }` )
		.join( '&' );

	return apiFetch< SubscribersResponse >( {
		path: `${ baseUrl }&${ filterQuery }`,
		method: 'GET',
	} );
}

/**
 * Fetch subscriber totals (total / email / paid / social) from the Jetpack REST proxy
 * (`GET /wpcom/v2/subscribers/totals`), which forwards to WP.com.
 *
 * @return Subscribers totals response.
 */
export function fetchSubscribersTotals(): Promise< SubscribersTotalsResponse > {
	return apiFetch< SubscribersTotalsResponse >( {
		path: '/wpcom/v2/subscribers/totals',
		method: 'GET',
	} );
}

/**
 * Cancel paid subscriptions and delete the WPCOM + email follower records for a single
 * subscriber, mirroring Calypso's `useSubscriberRemoveMutation` cascade. Bulk callers loop and
 * call this per subscriber.
 *
 * @param payload - Subscriber identifiers.
 * @return Per-step success / error report.
 */
export function removeSubscriber(
	payload: RemoveSubscriberPayload
): Promise< RemoveSubscriberResponse > {
	return apiFetch< RemoveSubscriberResponse >( {
		path: '/wpcom/v2/subscribers/remove',
		method: 'POST',
		data: {
			user_id: payload.user_id ?? 0,
			email_subscription_id: payload.email_subscription_id ?? 0,
			paid_subscription_ids: payload.paid_subscription_ids ?? [],
		},
	} );
}
