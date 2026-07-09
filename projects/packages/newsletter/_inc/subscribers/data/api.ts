import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import type {
	AddSubscribersResponse,
	ImportJob,
	RemoveSubscriberPayload,
	RemoveSubscriberResponse,
	SubscriberDetails,
	SubscriberStats,
	SubscribersQueryParams,
	SubscribersResponse,
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

/**
 * Import a list of email addresses as subscribers, mirroring Calypso's Add Subscribers modal
 * (`importCsvSubscribers`). The proxy forwards to `/sites/{id}/subscribers/import`, which starts
 * an async job — no invitation email is sent; WP.com emails a "Subscriber import completed"
 * summary when the job finishes.
 *
 * @param emails - Email addresses to import.
 * @return WP.com response carrying the import job id.
 */
export function addSubscribers( emails: string[] ): Promise< AddSubscribersResponse > {
	return apiFetch< AddSubscribersResponse >( {
		path: '/wpcom/v2/subscribers/add',
		method: 'POST',
		data: { emails },
	} );
}

/**
 * Fetch the site's subscriber import jobs, newest first. Used by the Add Subscribers modal to
 * detect an in-flight or stale import — WP.com runs one import per site at a time.
 *
 * @return Import jobs.
 */
export function fetchImportJobs(): Promise< ImportJob[] > {
	return apiFetch< ImportJob[] >( {
		path: '/wpcom/v2/subscribers/import',
		method: 'GET',
	} );
}

/**
 * Cancel stuck (pending / importing) subscriber import jobs, mirroring Calypso's stale-import
 * "Cancel import" action (`useSubscriberImportStatusReset`). The proxy forwards to
 * `/sites/{id}/subscribers/import/reset_state`.
 *
 * @return WP.com response with the number of jobs reset.
 */
export function resetImportState(): Promise< { reset_count?: number } > {
	return apiFetch( {
		path: '/wpcom/v2/subscribers/import/reset-state',
		method: 'POST',
	} );
}

type IndividualParams = {
	subscription_id?: number;
	user_id?: number;
};

/**
 * Fetch a single subscriber's profile via the Jetpack proxy. Pass `user_id` for WPCOM-mapped
 * subscribers and `subscription_id` for email-only ones (mirrors Calypso).
 *
 * @param params - Subscription identifiers.
 * @return Subscriber profile.
 */
export function fetchSubscriberDetails( params: IndividualParams ): Promise< SubscriberDetails > {
	return apiFetch< SubscriberDetails >( {
		path: addQueryArgs( '/wpcom/v2/subscribers/individual', {
			subscription_id: params.subscription_id ?? 0,
			user_id: params.user_id ?? 0,
		} ),
		method: 'GET',
	} );
}

/**
 * Fetch a single subscriber's engagement stats (emails sent, opens, clicks).
 *
 * @param params - Subscription identifiers.
 * @return Stats payload.
 */
export function fetchSubscriberStats( params: IndividualParams ): Promise< SubscriberStats > {
	return apiFetch< SubscriberStats >( {
		path: addQueryArgs( '/wpcom/v2/subscribers/individual-stats', {
			subscription_id: params.subscription_id ?? 0,
			user_id: params.user_id ?? 0,
		} ),
		method: 'GET',
	} );
}

export type MembershipsProduct = {
	id: number;
	title: string;
	currency?: string;
	// The wpcom proxy sends the price as a preformatted string (e.g. `12.00`), not a number.
	price?: string;
	// Billing cadence, e.g. `1 month` or `1 year`.
	interval?: string;
};

/**
 * Fetch the paid newsletter / membership products configured on this site. Used by the Comp
 * modal so the user can pick which plan to comp the subscriber on.
 *
 * @return Membership products.
 */
export function fetchMembershipsProducts(): Promise< MembershipsProduct[] > {
	return apiFetch< MembershipsProduct[] | { products?: MembershipsProduct[] } >( {
		path: '/wpcom/v2/subscribers/products',
		method: 'GET',
	} ).then( body => {
		if ( Array.isArray( body ) ) {
			return body;
		}
		return body?.products ?? [];
	} );
}

/**
 * Issue a complimentary subscription for a single subscriber on a chosen paid plan, mirroring
 * Calypso's `requestAddComp`. Server-side proxies to
 * `/sites/{id}/memberships/comps/{user_id}/{plan_id}`.
 *
 * @param payload               - Comp parameters.
 * @param payload.user_id       - WPCOM user id of the subscriber.
 * @param payload.plan_id       - Membership product id to comp.
 * @param payload.no_expiration - Whether the comp should never expire.
 * @return Raw WP.com response.
 */
export function addComp( payload: {
	user_id: number;
	plan_id: number;
	no_expiration?: boolean;
} ): Promise< { id?: number; message?: string } > {
	return apiFetch( {
		path: '/wpcom/v2/subscribers/comp',
		method: 'POST',
		data: payload,
	} );
}

/**
 * Revoke a complimentary subscription for a single subscriber, mirroring Calypso's
 * `requestDeleteComp`. Server-side proxies to `/sites/{id}/memberships/comp/{compId}` (DELETE).
 *
 * @param compId - Comp id to remove (`subscriber.plans[i].comp_id`).
 * @return Raw WP.com response.
 */
export function removeComp( compId: number ): Promise< { message?: string } > {
	return apiFetch( {
		path: '/wpcom/v2/subscribers/remove-comp',
		method: 'POST',
		data: { comp_id: compId },
	} );
}
