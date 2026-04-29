import type { Subscriber } from '../data/types';

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
