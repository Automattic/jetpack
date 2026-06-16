import type { RemoveSubscriberPayload, Subscriber } from '../data/types';

/**
 * Coerce a URL search-param value into a positive finite number.
 *
 * @param value - Raw search-param value (string, number, undefined).
 * @return Positive finite number, or undefined when the input is empty/invalid.
 */
export function toFiniteNumber( value: unknown ): number | undefined {
	if ( value === undefined || value === null || value === '' ) {
		return undefined;
	}
	const num = Number( value );
	return Number.isFinite( num ) && num > 0 ? num : undefined;
}

/**
 * Best-effort subscription date — Calypso prefers `wpcom_date_subscribed`, falling back to the
 * email subscription date for email-only subscribers. Returns the value with a `+00:00` suffix
 * appended (matching Calypso's `getFormattedSubscriptionDate` helper) so the date renders in the
 * caller's locale rather than UTC.
 *
 * @param subscriber - Subscriber.
 * @return ISO-ish date string or empty.
 */
export function getSubscribedAt( subscriber: Subscriber ): string {
	const raw = subscriber.wpcom_date_subscribed || subscriber.email_date_subscribed || '';
	if ( ! raw ) {
		return '';
	}
	return `${ raw }+00:00`;
}

/**
 * Stable row id — prefers `email_subscription_id`, falls back to wpcom subscription id, then user
 * id, then the email address. Mirrors `getSubscriptionIdFromSubscriber()` in Calypso.
 *
 * @param subscriber - Subscriber.
 * @return DataViews row id.
 */
export function getSubscriberRowId( subscriber: Subscriber ): string {
	const id =
		subscriber.email_subscription_id || subscriber.wpcom_subscription_id || subscriber.user_id || 0;
	return id ? String( id ) : subscriber.email_address;
}

/**
 * Build the payload the `/wpcom/v2/subscribers/remove` endpoint expects from a subscriber row.
 *
 * @param subscriber - Subscriber row.
 * @return Remove payload.
 */
export function getRemovePayload( subscriber: Subscriber ): RemoveSubscriberPayload {
	const paid_subscription_ids = ( subscriber.plans ?? [] )
		.map( plan => plan.paid_subscription_id )
		.filter( ( id ): id is string => typeof id === 'string' && id.length > 0 );

	return {
		user_id: subscriber.user_id || 0,
		email_subscription_id: subscriber.email_subscription_id || 0,
		paid_subscription_ids,
	};
}

/**
 * Display name fallback: prefer the subscriber's display name, else their email address.
 *
 * @param subscriber - Subscriber row.
 * @return Display string.
 */
export function getSubscriberLabel( subscriber: Subscriber ): string {
	return subscriber.display_name || subscriber.email_address;
}

/**
 * Whether the subscriber currently shown in the inspector — identified by the `subscriber`/`u`
 * URL params — is among a list of just-removed subscribers. Used to close the inspector when its
 * subscriber gets deleted from the table, so it doesn't linger with stale data. The open identity
 * mirrors `handleViewSubscriber`: `subscriptionId` is the email-or-wpcom subscription id, `userId`
 * is the wpcom user id. A removed row matches when either set identifier is the same.
 *
 * @param open                - Inspector's open identity from the URL.
 * @param open.subscriptionId - Email or wpcom subscription id the inspector is keyed by, if any.
 * @param open.userId         - WPCOM user id the inspector is keyed by, if any.
 * @param removed             - Subscribers that were just removed.
 * @return True when the open subscriber is among the removed rows.
 */
export function isOpenSubscriberRemoved(
	open: { subscriptionId?: number; userId?: number },
	removed: Subscriber[]
): boolean {
	const { subscriptionId, userId } = open;
	if ( ! subscriptionId && ! userId ) {
		return false;
	}
	return removed.some( subscriber => {
		const removedSubscriptionId =
			subscriber.email_subscription_id || subscriber.wpcom_subscription_id || undefined;
		const removedUserId = subscriber.user_id || undefined;
		return (
			( !! subscriptionId && removedSubscriptionId === subscriptionId ) ||
			( !! userId && removedUserId === userId )
		);
	} );
}

/**
 * Whether the subscribers list is empty except for the site owner. The WP.com endpoint always
 * returns the owner in the list (it only flags `is_owner_subscribed` rather than filtering them
 * out), so a brand-new site reports a single row and DataViews' `empty` slot never fires. Mirrors
 * Calypso's `hasNoSubscriberOtherThanAdmin` launchpad condition so the caller can present the
 * cold-start empty state instead.
 *
 * @param total             - Total subscriber count for the current (unfiltered) query.
 * @param isOwnerSubscribed - Whether the site owner is among the subscribers (`is_owner_subscribed`).
 * @return True when there are no subscribers, or the only subscriber is the owner.
 */
export function hasNoSubscribersOtherThanOwner(
	total: number,
	isOwnerSubscribed: boolean
): boolean {
	return total === 0 || ( total === 1 && isOwnerSubscribed );
}
