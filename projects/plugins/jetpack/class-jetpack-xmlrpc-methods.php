<?php
/**
 * Jetpack XMLRPC Methods.
 *
 * Registers the Jetpack specific XMLRPC methods
 *
 * @package jetpack
 */

/**
 * XMLRPC Methods registration and callbacks
 */
class Jetpack_XMLRPC_Methods {

	/**
	 * Initialize the main hooks.
	 */
	public static function init() {
		add_filter( 'jetpack_xmlrpc_unauthenticated_methods', array( __CLASS__, 'xmlrpc_methods' ) );
		add_filter( 'jetpack_xmlrpc_test_connection_response', array( __CLASS__, 'test_connection' ) );
	}

	/**
	 * Adds Jetpack specific methods to the methods added by the Connection package.
	 *
	 * @param array $methods Methods added by the Connection package.
	 */
	public function xmlrpc_methods( $methods ) {

		$methods['jetpack.featuresAvailable'] = array( __CLASS__, 'features_available' );
		$methods['jetpack.featuresEnabled']   = array( __CLASS__, 'features_enabled' );

		return $methods;
	}

	/**
	 * Returns what features are available. Uses the slug of the module files.
	 *
	 * @return array
	 */
	public static function features_available() {
		$raw_modules = Jetpack::get_available_modules();
		$modules     = array();
		foreach ( $raw_modules as $module ) {
			$modules[] = Jetpack::get_module_slug( $module );
		}

		return $modules;
	}

	/**
	 * Returns what features are enabled. Uses the slug of the modules files.
	 *
	 * @return array
	 */
	public static function features_enabled() {
		$raw_modules = Jetpack::get_active_modules();
		$modules     = array();
		foreach ( $raw_modules as $module ) {
			$modules[] = Jetpack::get_module_slug( $module );
		}

		return $modules;
	}

	/**
	 * Filters the result of test_connection XMLRPC method
	 *
	 * @return string The current Jetpack version number
	 */
	public function test_connection() {
		return JETPACK__VERSION;
	}
}
