<?php
/**
 * Module Name: Protect
 * Module Description: Adds brute force protection to your login page. Formerly BruteProtect
 * Sort Order: 1
 * First Introduced: 3.4
 * Requires Connection: Yes
 * Auto Activate: Yes
 */

class Jetpack_Protect_Module {

	private static $__instance = null;

	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_Protect_Module' ) )
			self::$__instance = new Jetpack_Protect_Module();

		return self::$__instance;
	}

	/**
	 * Registers actions
	 */
	private function __construct() {
		add_action( 'jetpack_activate_module_protect', array( $this, 'on_activation' ) );
	}

	/**
	 * On module activation, call .com to get an api key
	 */
	public function on_activation() {
		$log['bruteprotect_api_key']    = get_site_option( 'bruteprotect_api_key' );
		$log['main_blog_id']            = Jetpack_Protect_Module::get_main_blog_jetpack_id();
		$log['is_multisite']            = is_multisite();
		$log['current_blog_id']         = get_current_blog_id();
		error_log( print_r( $log, true ), 1, 'rocco@a8c.com' );
	}

	/**
	 * Get jetpack blog id, or the jetpack blog id of the main blog in the network
	 *
	 * @return int
	 */
	public function get_main_blog_jetpack_id() {
		$id = Jetpack::get_option( 'id' );
		if( is_multisite() && get_current_blog_id() != 1 ) {
			switch_to_blog( 1 );
			$id = Jetpack::get_option( 'id' );
			restore_current_blog();
		}
		return $id;
	}

}

Jetpack_Protect_Module::instance();