<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Module Name: Firewall
 * Module Description: Protect your site with Jetpack's Web Application Firewall
 * Sort Order: 5
 * First Introduced: 10.9
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Firewall
 * Feature: Security
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Waf\WafStandaloneBootstrap;

// Register endpoints when WP REST API is initialized.
add_action( 'rest_api_init', array( 'Jetpack_Firewall', 'register_endpoints' ) );

/**
 * Jetpack firewall module class.
 */
class Jetpack_Firewall {

	/**
	 * Register REST API endpoints.
	 */
	public static function register_endpoints() {
		register_rest_route(
			'jetpack/v4',
			'/waf_bootstrap_path',
			array(
				'methods'  => WP_REST_Server::READABLE,
				'callback' => __CLASS__ . '::get_bootstrap_path',
			)
		);
	}

	/**
	 * Get bootstrap.php file path.
	 */
	public static function get_bootstrap_path() {
		$bootstrap = new WafStandaloneBootstrap();
		return rest_ensure_response( $bootstrap->get_bootstrap_file_path() );
	}

}
