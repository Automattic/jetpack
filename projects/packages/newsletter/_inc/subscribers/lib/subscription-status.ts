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
 * Explain why a "Not sending" subscriber is not being sent to.
 *
 * @param reason - Raw subscription_status_reason from the API.
 * @return Translated explanation, or null when there is no reason to show.
 */
export function getSubscriptionStatusReasonLabel(
	reason?: SubscriptionStatusReason | null
): string | null {
	switch ( reason ) {
		case 'opted_out':
			return __(
				'This user paused all WordPress.com emails in their account settings. Only they can change this.',
				'jetpack-newsletter'
			);
		case 'bounced':
			return __(
				'Emails to this address bounced, so we stopped sending to it.',
				'jetpack-newsletter'
			);
		default:
			return null;
	}
}
