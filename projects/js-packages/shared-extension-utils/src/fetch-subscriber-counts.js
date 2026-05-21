import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * @typedef {object} SubscriberCountsApiResponse
 * @property {object}                   counts                   - Subscriber totals from the API.
 * @property {number}                   counts.total_subscribers - Total subscribers.
 * @property {number}                   counts.social_followers  - Social followers included in totals.
 * @property {number}                   counts.email_subscribers - Email subscribers.
 * @property {number}                   counts.paid_subscribers  - Paid subscribers.
 * @property {Record<string, string[]>} [errors]                 - WP_Error-style error payload.
 */

/**
 * @typedef {object} SubscriberCounts
 * @property {number|null} totalSubscribers - Total subscribers.
 * @property {number|null} socialFollowers  - Social followers.
 * @property {number|null} emailSubscribers - Email subscribers.
 * @property {number|null} paidSubscribers  - Paid subscribers.
 */

/**
 * Fetch subscriber counts for the current site.
 *
 * Uses `/wpcom/v2/subscribers/counts`, proxied on connected Jetpack sites.
 * Shared by the membership-products data store and other admin UI.
 *
 * @return {Promise<SubscriberCountsApiResponse>} API response.
 */
export async function fetchSubscriberCounts() {
	const response = await apiFetch( {
		path: addQueryArgs( '/wpcom/v2/subscribers/counts', {
			subscriber_status: 'active',
			subscription_status: 'active',
		} ),
	} );

	if ( ! response || typeof response !== 'object' ) {
		throw new Error( 'Unexpected API response' );
	}

	/**
	 * WP_Error returns a list of errors with custom names:
	 * `errors: { foo: [ 'message' ], bar: [ 'message' ] }`
	 * Since we don't know their names, to get the message, we transform the object
	 * into an array, and just pick the first message of the first error.
	 *
	 * @see https://developer.wordpress.org/reference/classes/wp_error/
	 */
	const wpError = response?.errors && Object.values( response.errors )?.[ 0 ]?.[ 0 ];
	if ( wpError ) {
		throw new Error( wpError );
	}

	return response;
}

/**
 * Map the subscribers/counts API payload to the membership-products store shape.
 *
 * @param {SubscriberCountsApiResponse} response - API response from {@link fetchSubscriberCounts}.
 * @return {SubscriberCounts} Normalized counts.
 */
export function mapSubscriberCountsFromResponse( response ) {
	const { counts } = response;

	return {
		totalSubscribers: counts?.total_subscribers ?? null,
		socialFollowers: counts?.social_followers ?? null,
		emailSubscribers: counts?.email_subscribers ?? null,
		paidSubscribers: counts?.paid_subscribers ?? null,
	};
}
