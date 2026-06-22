<?php
/**
 * TEMPORARY: interim port for WOOA7S-1550 — remove when the shared sync-modules composer package lands.
 *
 * Minimal slice of woocommerce-analytics' HelperTraits\Utilities trait: only the
 * helpers actually referenced by the ported sync module and its registration.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Sync;

use Automattic\WooCommerce\Internal\Features\FeaturesController;
use DateTimeZone;
use WC_DateTime;

defined( 'ABSPATH' ) || exit;

/**
 * Trait Utilities.
 *
 * WooCommerce is a runtime (not composer) dependency, so the WC symbols below are
 * only ever reached when WooCommerce is active. Callers guard with class/function
 * existence checks; see {@see Configuration::register()}.
 */
trait Utilities {

	/**
	 * Can site sync orders to WPCOM infrastructure.
	 *
	 * @return boolean
	 */
	protected function can_site_sync_orders(): bool {
		return $this->is_order_attribution_enabled();
	}

	/**
	 * Check if the order attribution feature is enabled.
	 *
	 * @return bool
	 */
	protected function is_order_attribution_enabled(): bool {

		if ( ! class_exists( FeaturesController::class ) || ! function_exists( 'wc_get_container' ) ) {
			return false;
		}

		try {
			$feature_controller = wc_get_container()->get( FeaturesController::class );
			'@phan-var FeaturesController $feature_controller';
			$is_enabled = $feature_controller->feature_is_enabled( 'order_attribution' );

			/*
			 * When the feature settings form is submitted, feature_is_enabled won't return false right away
			 * We need to check what value was actually posted. Only checked options are posted.
			 * So if it's a POST request and $_POST[ 'woocommerce_custom_orders_table_enabled' ] does not exist
			 * we optimistically assume this is now false.
			 */
			// phpcs:disable WordPress.Security.NonceVerification.Recommended
			if ( isset( $_GET['section'] ) && 'features' === $_GET['section'] ) {
				// phpcs:disable WordPress.Security.NonceVerification.Missing
				if ( isset( $_POST['woocommerce_feature_order_attribution_enabled'] ) ) {
					$posted_order_attribution = wc_clean( sanitize_text_field( wp_unslash( $_POST['woocommerce_feature_order_attribution_enabled'] ) ) );
					$is_enabled               = wc_string_to_bool( $posted_order_attribution );
				} elseif ( isset( $_SERVER['REQUEST_METHOD'] ) && 'POST' === $_SERVER['REQUEST_METHOD'] ) {
					$is_enabled = false;
				}
				// phpcs:enable WordPress.Security.NonceVerification.Missing
			}
			// phpcs:enable WordPress.Security.NonceVerification.Recommended

			return $is_enabled;
		} catch ( \Exception $e ) {
			return false;
		}
	}

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
