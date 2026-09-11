<?php
/**
 * Resolves the calypso_omnibar_free_domain_upsell_20260825 experiment variation server-side.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Status\Host;

/**
 * Reads the omnibar free-domain upsell variation for the current user.
 */
class Free_Domain_Upsell_Experiment {

	const EXPERIMENT_NAME = 'calypso_omnibar_free_domain_upsell_test';

	/**
	 * Which sidebar JITM the current user/site would qualify for, or null.
	 *
	 * @return string|null 'free_to_paid_plan', 'monthly_to_annual_plan', or null.
	 */
	public static function get_upsell_source() {
		if ( ! is_user_logged_in() || ! current_user_can( 'manage_options' ) ) {
			return null;
		}

		if ( ! ( new Host() )->is_wpcom_simple() ) {
			return null;
		}

		if ( (bool) get_option( 'wpcom_is_staging_site' ) ) {
			return null;
		}

		$host = wp_parse_url( home_url(), PHP_URL_HOST );
		if ( ! is_string( $host ) || ! str_ends_with( $host, '.wordpress.com' ) ) {
			return null;
		}

		$current_plan = self::get_current_plan();
		if ( ! is_array( $current_plan ) ) {
			return null;
		}

		if ( ! empty( $current_plan['is_free'] ) && empty( get_option( 'options' )['is_domain_only'] ) ) {
			return 'free_to_paid_plan';
		}

		if ( str_ends_with( (string) ( $current_plan['product_slug'] ?? '' ), '-monthly' ) ) {
			return 'monthly_to_annual_plan';
		}

		return null;
	}

	/**
	 * Whether the current user/site is eligible for the omnibar free-domain upsell.
	 *
	 * @return bool
	 */
	public static function is_eligible() {
		return null !== self::get_upsell_source();
	}

	/**
	 * Whether the winning sidebar notice should be suppressed for this user.
	 *
	 * @param string $notice_id The id of the winning sidebar notice.
	 * @return bool
	 */
	public static function should_suppress_sidebar_notice( $notice_id ) {
		if ( ! in_array( $notice_id, array( 'free_to_paid_plan', 'monthly_to_annual_plan' ), true ) ) {
			return false;
		}

		if ( ! self::is_eligible() ) {
			return false;
		}

		return 'treatment' === self::get_variation();
	}

	/**
	 * The current plan data for this blog, or null when unavailable.
	 *
	 * @return array|null
	 */
	private static function get_current_plan() {
		if ( ! class_exists( '\WPCOM_Store_API' ) ) {
			return null;
		}

		$plan = \WPCOM_Store_API::get_current_plan( get_current_blog_id() );

		return is_array( $plan ) ? $plan : null;
	}

	/**
	 * The current user's variation: 'control' or 'treatment'.
	 *
	 * @return string
	 */
	public static function get_variation() {
		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return 'control';
		}

		$cache_key = 'free-domain-upsell-variation-' . $user_id;
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return (string) $cached;
		}

		$raw = self::fetch_variation();

		if ( null === $raw ) {
			return 'control';
		}

		$variation = self::normalize( $raw );
		set_transient( $cache_key, $variation, HOUR_IN_SECONDS );

		return $variation;
	}

	/**
	 * Fetch the raw variation name from ExPlat, or null.
	 *
	 * @return string|null
	 */
	private static function fetch_variation() {
		if ( ! ( new Host() )->is_wpcom_simple() ) {
			return null;
		}

		if ( function_exists( '\ExPlat\assign_current_user' ) ) {
			return \ExPlat\assign_current_user( self::EXPERIMENT_NAME );
		}

		return null;
	}

	/**
	 * Map any variation onto a known value; unknown/null becomes 'control'.
	 *
	 * @param string|null $variation The raw variation name.
	 * @return string
	 */
	private static function normalize( $variation ) {
		return 'treatment' === $variation ? 'treatment' : 'control';
	}
}
