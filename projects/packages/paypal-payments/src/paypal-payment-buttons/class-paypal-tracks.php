<?php
/**
 * Tracks events for PayPal Payment Buttons.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Tracking;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PayPal_Tracks
 *
 * Records `jetpack_paypal_*` events for what PayPal reports about the site's payments.
 *
 * @since $$next-version$$
 */
class PayPal_Tracks {

	/**
	 * Every event name carries this after the `jetpack_` product prefix.
	 *
	 * @var string
	 */
	const EVENT_PREFIX = 'paypal_';

	/**
	 * Record an event.
	 *
	 * Payments are reported by PayPal, not by a logged-in user, so events go to the
	 * connection owner, as the WordPress.com events for the legacy buttons went to
	 * the product's author. Without an owner nothing is recorded.
	 *
	 * @param string $event      The event name, without the `jetpack_paypal_` prefix.
	 * @param array  $properties Properties to send with the event.
	 * @return bool Whether the event was recorded.
	 */
	public static function record( $event, array $properties = array() ) {
		$connection = new Manager();
		$owner      = $connection->get_connection_owner();
		if ( ! $owner ) {
			return false;
		}

		$properties['environment'] = PayPal_OAuth::get_environment();

		$tracking = new Tracking( 'jetpack', $connection );
		$result   = $tracking->record_user_event( self::EVENT_PREFIX . $event, $properties, $owner );

		return true === $result;
	}
}
