<?php
/**
 * Tracks events captured by the test bootstrap.
 *
 * @package automattic/jetpack-paypal-payments
 */

namespace Automattic\Jetpack\PaypalPayments;

/**
 * Reads the Tracks events a test recorded.
 */
trait PayPal_Tracks_Events {

	/**
	 * The Tracks events recorded so far, without the `blog_id` and `platform`
	 * PayPal_Tracks adds to every event.
	 *
	 * @return array[] Each event's name and properties.
	 */
	private function recorded_events() {
		return array_map(
			function ( $event ) {
				unset( $event['properties']['blog_id'], $event['properties']['platform'] );

				return array(
					'event_name' => $event['event_name'],
					'properties' => $event['properties'],
				);
			},
			$GLOBALS['jetpack_paypal_test_captured_events'] ?? array()
		);
	}
}
