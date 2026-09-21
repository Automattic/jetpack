import type { RemoveSubscriberPayload, Subscriber, SubscriberDetails } from '../data/types';

// Trailing `Z` or `±HH:MM` / `±HHMM` offset.
const HAS_TIMEZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

// WP.com passes through a zero date when the record carries no subscription timestamp, rather
// than omitting the field. Rendering it would print a year-0000 date, so treat it as absent.
const ZERO_DATE = /^0000-00-00/;

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
 * Turn a naive UTC timestamp into ISO 8601, leaving zoned ones alone; zero dates come back empty.
 *
 * @param raw - Date string from either payload shape.
 * @return ISO-ish date string or empty.
 */
function normalizeDate( raw?: string | null ): string {
	if ( ! raw || ZERO_DATE.test( raw ) ) {
		return '';
	}
	return HAS_TIMEZONE.test( raw ) ? raw : `${ raw.replace( ' ', 'T' ) }+00:00`;
}

/**
 * Earliest of the subscriber's Reader and email subscription dates.
 *
 * Matches WP.com's date sort, which orders by the earlier non-zero date. List dates are naive UTC,
 * individual dates already carry an offset. `date_subscribed` is the fallback for older payloads.
 *
 * @param subscriber - Subscriber row or detail payload.
 * @return ISO-ish date string or empty.
 */
export function getSubscribedAt( subscriber: Subscriber | SubscriberDetails ): string {
	const isValid = ( date: string ) => !! date && ! Number.isNaN( Date.parse( date ) );
	// The individual endpoint also returns cancelled email subscriptions, which report
	// `Not subscribed`; the list never fetches them, so skip them to keep both views in step.
	const emailDate =
		subscriber.subscription_status === 'Not subscribed' ? null : subscriber.email_date_subscribed;
	const dates = [ subscriber.wpcom_date_subscribed, emailDate ]
		.map( normalizeDate )
		.filter( isValid );

	if ( ! dates.length ) {
		const fallback = normalizeDate( ( subscriber as SubscriberDetails ).date_subscribed );
		return isValid( fallback ) ? fallback : '';
	}
	return dates.reduce( ( earliest, date ) =>
		Date.parse( date ) < Date.parse( earliest ) ? date : earliest
	);
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
