<?php
namespace Automattic\Jetpack\Partners;

use Jetpack;

if ( ! defined( 'ABSPATH' ) || ! is_admin() ) {
	exit; // Exit if accessed directly or not in admin.
}

/**
 * This class introduces routines to get an affiliate code, that might be obtained from:
 * - a `jetpack_affiliate_code` option in the WP database
 * - an affiliate code returned by a filter bound to the `jetpack_affiliate_code` filter hook
 *
 * @since 6.9.0
 */
class Affiliate {

	/**
	 * Class instance
	 *
	 * @since 6.9.0
	 *
	 * @var Affiliate This class instance.
	 **/
	private static $instance = null;

	/**
	 * Affiliate constructor.
	 */
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
	 * @return Affiliate | false
	 */
	public static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Affiliate();
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
		$aff = $this->get_affiliate_code();
		if ( '' !== $aff ) {
			$url = add_query_arg( 'aff', $aff, $url );
		}
		return $url;
	}
}

add_action( 'init', array( 'Automattic\Jetpack\Partners\Affiliate', 'init' ) );

