import { __ } from '@wordpress/i18n';
import type { SubscriptionStatus } from '../data/types';

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
