<?php
/**
 * The Scan REST Controller.
 *
 * Registers the `/jetpack/v4/site/scan/*` routes backing the admin UI.
 * Each route proxies to the corresponding WPCOM v2 endpoint, authenticated
 * with the user's Jetpack token. The actual proxy implementations land in
 * later phases — this controller currently registers the namespace and a
 * permission-checked placeholder so the route surface is reserved.
 *
 * @package automattic/jetpack-scan-page
 */

namespace Automattic\Jetpack\Scan_Page;

use WP_Error;
use function current_user_can;
use function esc_html__;
use function register_rest_route;

/**
 * REST routes for the Scan UI.
 */
class REST_Controller {

	/**
	 * REST namespace used by this package.
	 *
	 * @var string
	 */
	const REST_NAMESPACE = 'jetpack/v4';

	/**
	 * REST route prefix used by this package.
	 *
	 * @var string
	 */
	const REST_ROUTE_PREFIX = 'site/scan';

	/**
	 * Register the REST routes backing the Scan UI.
	 *
	 * Routes proxying to WPCOM are added in later phases. This method
	 * exists now so that the namespace is reserved and the hook is wired.
	 */
	public static function register_rest_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/' . self::REST_ROUTE_PREFIX,
			array(
				'methods'             => 'GET',
				'callback'            => array( __CLASS__, 'placeholder' ),
				'permission_callback' => array( __CLASS__, 'permissions_check' ),
			)
		);
	}

	/**
	 * Permission callback: admin-only. Mirrors the gate in
	 * `Jetpack_Scan::is_available()`.
	 *
	 * @return bool|WP_Error
	 */
	public static function permissions_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				esc_html__( 'You do not have permission to access this resource.', 'jetpack-scan-page' ),
				array( 'status' => 401 )
			);
		}

		return true;
	}

	/**
	 * Placeholder handler for the not-yet-implemented overview endpoint.
	 *
	 * @return WP_Error
	 */
	public static function placeholder() {
		return new WP_Error(
			'jetpack_scan_not_implemented',
			esc_html__( 'The Scan REST endpoints are not implemented yet.', 'jetpack-scan-page' ),
			array( 'status' => 501 )
		);
	}
}
