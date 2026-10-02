<?php
/**
 * Tracks events for PayPal Payment Buttons.
 *
 * @package automattic/jetpack-paypal-payments
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\PaypalPayments;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Host;
use Throwable;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PayPal_Tracks
 *
 * Records server-side Tracks events as the current user, via wpcom's
 * `tracks_record_event()` on Simple and Jetpack's Tracking elsewhere.
 */
class PayPal_Tracks {

	/**
	 * Record a Tracks event, adding `blog_id` and `platform`.
	 *
	 * Outside Simple this sends a blocking pixel request, so a front-end
	 * caller should check for Simple first.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $event_name Full event name, e.g. `jetpack_paypal_button_created`.
	 * @param array  $properties Event properties. Keep personal data out.
	 * @return void
	 */
	public static function record_event( string $event_name, array $properties = array() ) {
		try {
			$user                   = wp_get_current_user();
			$properties['blog_id']  = (int) Connection_Manager::get_site_id( true );
			$properties['platform'] = self::platform();

			if ( ! function_exists( 'tracks_record_event' ) && function_exists( 'require_lib' ) ) {
				require_lib( 'tracks/client' );
			}

			if ( function_exists( 'tracks_record_event' ) ) {
				tracks_record_event( $user, $event_name, $properties );
				return;
			}

			if ( class_exists( '\Automattic\Jetpack\Tracking' ) ) {
				( new \Automattic\Jetpack\Tracking() )->tracks_record_event( $user, $event_name, $properties );
			}
		} catch ( Throwable $e ) {
			// Tracks is best-effort, so swallow its errors and let the recorded action finish.
			unset( $e );
		}
	}

	/**
	 * The host the event came from.
	 *
	 * @since $$next-version$$
	 *
	 * @return string `simple`, `atomic` or `self_hosted`.
	 */
	private static function platform() {
		$host = new Host();

		if ( $host->is_wpcom_simple() ) {
			return 'simple';
		}

		return $host->is_woa_site() ? 'atomic' : 'self_hosted';
	}
}
