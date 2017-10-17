<?php
/**
 * Plugin Name: Performance
 * Description: Web site performance optimisations
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Automattic
 * Author URI: https://automattic.com
 * Version: 0.1.0
 * Text Domain: perf
 * Domain Path: /languages/
 * License: GPLv2 or later
 */

require_once( dirname( __FILE__ ) . '/class.jetpack-perf-optimize-assets.php' );

class Jetpack_Perf {
	private static $__instance = null;
	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_Perf' ) ) {
			self::$__instance = new Jetpack_Perf();
		}

		return self::$__instance;
	}

	private function __construct() {
		// enable components
		Jetpack_Perf_Optimize_Assets::instance();
	}

	static function get_setting( $name ) {
		// by default, our settings are on
		$default_value = ( 'inline_on_every_request' === $name ) ? false : true;
		get_option( "perf_$name", $default_value );
	}
}
