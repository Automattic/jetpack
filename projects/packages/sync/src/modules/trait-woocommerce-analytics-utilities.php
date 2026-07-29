<?php
/**
 * WooCommerce Analytics sync helpers.
 *
 * Minimal slice of woocommerce-analytics' HelperTraits\Utilities trait containing
 * only the helpers referenced by the WooCommerce Analytics sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use DateTimeZone;
use WC_DateTime;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Trait WooCommerce_Analytics_Utilities.
 *
 * WooCommerce is a runtime (not composer) dependency, so consumers must only
 * register the module when WooCommerce is active.
 */
trait WooCommerce_Analytics_Utilities {

	/**
	 * Maps order status provided by the user to the one used in the database.
	 *
	 * @param string $status Order status.
	 * @return string
	 */
	protected static function normalize_order_status( $status ) {
		$status                 = str_replace( 'wc-', '', $status );
		$wc_order_status_keys   = array_keys( wc_get_order_statuses() );
		$wc_order_status_keys[] = 'wc-checkout-draft'; // Related to Woo bug as `wc-checkout-draft` is missing from `wc_get_order_statuses`.

		return in_array( 'wc-' . $status, $wc_order_status_keys, true ) ? 'wc-' . $status : $status;
	}

	/**
	 * Convert the WC_DateTime objects to stdClass objects to ensure they are properly encoded.
	 *
	 * @param WC_DateTime|mixed $wc_datetime The datetime object.
	 * @param bool              $utc         Whether to convert to UTC.
	 * @return object|null
	 */
	protected static function datetime_to_object( $wc_datetime, $utc = false ) {
		if ( is_string( $wc_datetime ) ) {
			$wc_datetime = new WC_DateTime( $wc_datetime, self::get_site_datetimezone() );
		}

		if ( is_a( $wc_datetime, 'WC_DateTime' ) ) {
			if ( $utc ) {
				$wc_datetime->setTimezone( new DateTimeZone( 'UTC' ) );
			} else {
				$wc_datetime->setTimezone( self::get_site_datetimezone() );
			}
			return (object) (array) $wc_datetime;
		}
	}

	/**
	 * Convert offset in seconds to ISO 8601 timezone offset format.
	 *
	 * @param int|float $offset_seconds The timezone offset in seconds.
	 * @return string The ISO 8601 timezone offset string (e.g., '+08:00', '-08:30', '+00:00').
	 */
	protected static function format_utc_offset( $offset_seconds ) {
		$hours   = intval( abs( $offset_seconds ) / HOUR_IN_SECONDS );
		$minutes = intval( ( abs( $offset_seconds ) % HOUR_IN_SECONDS ) / MINUTE_IN_SECONDS );
		$sign    = $offset_seconds >= 0 ? '+' : '-';

		return sprintf( '%s%02d:%02d', $sign, $hours, $minutes );
	}

	/**
	 * Get DateTimeZone object for WooCommerce timezone.
	 *
	 * @return DateTimeZone The DateTimeZone object for the site timezone.
	 */
	protected static function get_site_datetimezone() {
		return new DateTimeZone( self::format_utc_offset( wc_timezone_offset() ) );
	}
}
