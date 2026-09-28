<?php
/**
 * Tracks events for the on-site PayPal checkout.
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
 * Class PayPal_Checkout_Tracks
 *
 * Records one `jetpack_paypal_checkout_*` event per order created or captured
 * through the site's checkout routes, and per attempt that failed.
 *
 * @since $$next-version$$
 */
class PayPal_Checkout_Tracks {

	/**
	 * Prefix every event name carries after the product one.
	 *
	 * @var string
	 */
	const EVENT_PREFIX = 'paypal_checkout_';

	/**
	 * Record a checkout event.
	 *
	 * Buyers are logged out, so events go to the connection owner, as the
	 * WordPress.com events for the legacy buttons went to the product's author.
	 * Without an owner nothing is recorded: no buyer gets a Tracks cookie.
	 *
	 * @param string $event      The event name, without the `jetpack_paypal_checkout_` prefix.
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

	/**
	 * The properties an API or pricing error contributes to a failure event.
	 *
	 * @param \WP_Error $error The error the route is about to answer with.
	 * @return array error_code and, when known, the HTTP status.
	 */
	public static function error_properties( \WP_Error $error ) {
		$properties = array( 'error_code' => $error->get_error_code() );

		$data = $error->get_error_data();
		if ( is_array( $data ) && isset( $data['status'] ) ) {
			$properties['http_status'] = (int) $data['status'];
		}

		return $properties;
	}
}
