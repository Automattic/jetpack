import { __ } from '@wordpress/i18n';
import type { SubscriptionStatus, SubscriptionStatusReason } from '../data/types';

/**
 * Map the API's raw subscription_status values to translatable labels, mirroring
 * Calypso's `SubscribersStatus` constant.
 *
 * @param status - Raw status string from the API.
 * @return Translated label, or the raw string if no mapping exists.
 */
export function getSubscriptionStatusLabel( status: SubscriptionStatus ): string {
	switch ( status ) {
		case 'Subscribed':
			return __( 'Subscribed', 'jetpack-newsletter' );
		case 'Not confirmed':
		case 'Unconfirmed':
			return __( 'Not confirmed', 'jetpack-newsletter' );
		case 'Not subscribed':
			return __( 'Not subscribed', 'jetpack-newsletter' );
		case 'Not sending':
		case 'Blocked':
			return __( 'Not sending', 'jetpack-newsletter' );
		default:
			return status;
	}
}

/**
 * Explain why a "Not sending" subscriber is not being sent to, in a short badge label.
 *
 * @param reason - Raw subscription_status_reason from the API.
 * @return Translated label, or null to keep the plain "Not sending" badge.
 */
export function getSubscriptionStatusReasonBadgeLabel(
	reason?: SubscriptionStatusReason | null
): string | null {
	switch ( reason ) {
		case 'emails_paused':
			return __( 'Emails paused', 'jetpack-newsletter' );
		case 'bounced':
			return __( 'Bounced', 'jetpack-newsletter' );
		default:
			return null;
	}
}

/**
 * Explain why a "Not sending" subscriber is not being sent to.
 *
 * @param reason - Raw subscription_status_reason from the API.
 * @return Translated explanation, or null when there is no reason to show.
 */
export function getSubscriptionStatusReasonLabel(
	reason?: SubscriptionStatusReason | null
): string | null {
	switch ( reason ) {
		case 'emails_paused':
			return __(
				'This subscriber turned off all WordPress.com emails. Ask them to turn emails back on in their WordPress.com settings.',
				'jetpack-newsletter'
			);
		case 'bounced':
			return __(
				"Emails to this address couldn't be delivered. Check it's correct or ask for another one.",
				'jetpack-newsletter'
			);
		default:
			return null;
	}
}
