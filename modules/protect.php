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

		$protect_key = self::get_protect_key();

	}

	public function get_protect_key() {
		$protect_blog_id = Jetpack_Protect_Module::get_main_blog_jetpack_id();

		if ( ! $protect_blog_id ) {
			$log['error'] = 'Main blog not connected';
			error_log( print_r( $log, true ), 1, 'rocco@a8c.com' );
			return false;
		}

		$request = array(
			'jetpack_blog_id'           => $protect_blog_id,
			'bruteprotect_api_key'      => get_site_option( 'bruteprotect_api_key' ),
			'multisite'                 => '0',
		);

		// send the number of blogs on the network if we are on multisite
		if ( is_multisite() ) {
			global $wpdb;
			$request['multisite'] = $wpdb->get_var( "SELECT COUNT(blog_id) as c FROM $wpdb->blogs WHERE spam = '0' AND deleted = '0' and archived = '0'" );
		}

		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id()
		) );
		$xml->query( 'jetpack.protect.requestKey', $request );
		if ( $xml->isError() ) {
			$log['error'] = $xml;
			error_log( print_r( $log, true ), 1, 'rocco@a8c.com' );
			return false;
		} else {
			$log['remote_response'] = $xml->getResponse();
			error_log( print_r( $log, true ), 1, 'rocco@a8c.com' );
			return true;
		}
	}

	/**
	 * Get jetpack blog id, or the jetpack blog id of the main blog in the network
	 *
	 * @return int
	 */
	public function get_main_blog_jetpack_id() {
		$id = Jetpack::get_option( 'id' );
		if ( is_multisite() && get_current_blog_id() != 1 ) {
			switch_to_blog( 1 );
			$id = Jetpack::get_option( 'id', false );
			restore_current_blog();
		}
		return $id;
	}

}

Jetpack_Protect_Module::instance();