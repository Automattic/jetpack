import type { Subscriber, SubscriptionStatus } from '../data/types';

/**
 * Statuses whose subscribers wpcom's comps route is guaranteed to reject with
 * `subscriber_not_confirmed`: it resolves an email only when the reader has an *active*
 * `email_blog_subscriptions` row, and these are the statuses that mean they don't.
 * `Not sending` is deliberately absent — that's a blocked reader whose row may still be active.
 */
const UNCOMPABLE_EMAIL_STATUSES: SubscriptionStatus[] = [
	'Not confirmed',
	'Unconfirmed',
	'Not subscribed',
];

/**
 * Whether a subscriber can be comped on a paid plan.
 *
 * A wpcom user id is the straightforward case. Otherwise wpcom resolves the subscriber from
 * their email address — creating a passwordless account if needed — which is how email-only
 * readers were comped before the dashboard replaced Calypso (NL-1033).
 *
 * @param subscriber - Subscriber row.
 * @return Whether to offer the comp action.
 */
export function canCompSubscriber( subscriber: Subscriber ): boolean {
	if ( subscriber.user_id ) {
		return true;
	}

	return (
		!! subscriber.email_address &&
		! UNCOMPABLE_EMAIL_STATUSES.includes( subscriber.subscription_status )
	);
}
