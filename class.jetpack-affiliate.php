<?php

if ( ! defined( 'ABSPATH' ) ) {
	// Exit if accessed directly
	exit;
}

/**
 * This class introduces routines to get an affiliate code, that might be obtained from:
 * - an `jetpack_affiliate_code` option in the WP database
 * - an affiliate code returned by a filter bound to the `jetpack_affiliate_code` filter hook
 *
 * @since 6.9.0
 */
class Jetpack_Affiliate {

	/**
	 * @since 6.9.0
	 * @var Jetpack_Affiliate This class instance.
	 **/
	private static $instance = null;

	private function __construct() {
		if ( Jetpack::is_development_mode() ) {
			return;
		}
	}

	/**
	 * Initializes the class or returns the singleton
	 *
	 * @since 6.9.0
	 *
	 * @return Jetpack_Affiliate | false
	 */
	public static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_Affiliate;
		}
		return self::$instance;
	}

	/**
	 * Returns the affiliate code from database after filtering it.
	 *
	 * @since 6.9.0
	 *
	 * @return string The affiliate code.
	 */
	public function get_affiliate_code() {
		/**
		 * Allow to filter the affiliate code.
		 *
		 * @since 6.9.0
		 *
		 * @param string $aff_code The affiliate code, blank by default.
		 */
		return apply_filters( 'jetpack_affiliate_code', get_option( 'jetpack_affiliate_code', '' ) );
	}

	/**
	 * Returns the passed URL with the affiliate code added as a URL query arg.
	 *
	 * @since 6.9.0
	 *
	 * @param string $url The URL where the code will be added.
	 *
	 * @return string The passed URL with the code added.
	 */
	public function add_code_as_query_arg( $url ) {
		if ( '' !== ( $aff = $this->get_affiliate_code() ) ) {
			$url = add_query_arg( 'aff', $aff, $url );
		}
		return $url;
	}
}

add_action( 'init', array( 'Jetpack_Affiliate', 'init' ) );
