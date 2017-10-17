<?php
/**
 * Plugin Name: PWA
 * Description: Add Progressive Web App support to your WordPress site.
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Automattic
 * Author URI: https://automattic.com
 * Version: 0.4.2
 * Text Domain: pwa
 * Domain Path: /languages/
 * License: GPLv2 or later
 */

 /**
  * Include the following PWA capabilities:
  * - cache the home page and posts/pages
  * - cache all CSS and JS
  * - show offline/online status using body class "jetpack__offline"
  * TODO:
  * - push updates, including UI to disable, and when/what to push (new posts? new products? posts in a taxonomy?)
  * - push content as well as notifications?
  * - how to cache within wp-admin? (disabled for now)
  * - hook WP's native cache functions (or sync?) to expire and push updates to sites
  */

require_once( dirname( __FILE__ ) . '/class.jetpack-pwa-service-worker.php' );
require_once( dirname( __FILE__ ) . '/class.jetpack-pwa-manifest.php' );
require_once( dirname( __FILE__ ) . '/class.jetpack-pwa-network-status.php' );
require_once( dirname( __FILE__ ) . '/class.jetpack-pwa-web-push.php' );

class Jetpack_PWA {
	private static $__instance = null;
	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_PWA' ) ) {
			self::$__instance = new Jetpack_PWA();
		}

		return self::$__instance;
	}

	private function __construct() {
		// enable PWA components
		Jetpack_PWA_Service_Worker::instance();
		Jetpack_PWA_Manifest::instance();
		Jetpack_PWA_Network_Status::instance();
		Jetpack_PWA_Web_Push::instance();

		// TODO - just notify user instead
		// add_action( 'template_redirect', array( $this, 'force_https' ), 1 );
	}

	// public function force_https () {
	// 	if ( !is_ssl() ) {
	// 		wp_redirect('https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'], 301 );
	// 		exit();
	// 	}
	// }

	public function site_icon_url( $size ) {
		$url = get_site_icon_url( $size );

		if ( ! $url ) {
			if ( ! function_exists( 'jetpack_site_icon_url' ) ) {
				require_once( JETPACK__PLUGIN_DIR . 'modules/site-icon/site-icon-functions.php' );
			}
			$url = jetpack_site_icon_url( null, $size );
		}

		// fall back to built in logo
		if ( ! $url && file_exists( dirname( __FILE__ ) . "/assets/images/wordpress-$size.png" ) ) {
			$url = plugins_url( "assets/images/wordpress-$size.png", __FILE__ );
		}

		return $url;
	}
}
