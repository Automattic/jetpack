<?php
/**
 * Sets up the Purchases REST API endpoints.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Host as Status_Host;
use WP_Error;

/**
 * Registers the REST routes for Purchases.
 *
 * @phan-constructor-used-for-side-effects
 */
class REST_Purchases {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$route_args = array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => __CLASS__ . '::get_site_current_purchases',
			'permission_callback' => __CLASS__ . '::permissions_callback',
		);

		/*
		 * The cross-platform route.
		 *
		 * `my-jetpack/v1` is not an available namespace on WordPress.com Simple, so the My Jetpack
		 * UI cannot call it everywhere. `wpcom/v2` is registered on Simple, Atomic and self-hosted
		 * Jetpack sites alike, which lets the UI request one path regardless of platform.
		 */
		register_rest_route( 'wpcom/v2', 'my-jetpack/purchases', $route_args );

		/*
		 * The original route, retained for backwards compatibility with any existing consumer.
		 * It is not available on Simple and the My Jetpack UI no longer calls it; both routes
		 * return the same data.
		 */
		register_rest_route( 'my-jetpack/v1', '/site/purchases', $route_args );
	}

	/**
	 * Check user capability to access the endpoint.
	 *
	 * @access public
	 * @static
	 *
	 * @return true|WP_Error
	 */
	public static function permissions_callback() {
		// Simple sites hold this data locally and have no blog token to sign a request with, so
		// the connection check would always fail there.
		$is_wpcom_simple = ( new Status_Host() )->is_wpcom_simple();

		if ( ! $is_wpcom_simple && ! ( new Connection_Manager() )->is_connected() ) {
			return new WP_Error(
				'not_connected',
				__( 'Your site is not connected to Jetpack.', 'jetpack-my-jetpack' ),
				array(
					'status' => 400,
				)
			);
		}

		return current_user_can( 'edit_posts' );
	}

	/**
	 * Site purchases endpoint.
	 *
	 * Delegates to Wpcom_Products so every caller shares one code path. That helper is where the
	 * `my_jetpack_site_purchases` filter lives, which is how a platform holding the data locally
	 * (WordPress.com Simple) serves it without a request to WordPress.com.
	 *
	 * @return \WP_REST_Response|WP_Error of site purchases.
	 */
	public static function get_site_current_purchases() {
		$purchases = Wpcom_Products::get_site_current_purchases();

		if ( is_wp_error( $purchases ) ) {
			return new WP_Error( 'site_data_fetch_failed', 'Site data fetch failed', array( 'status' => 400 ) );
		}

		return rest_ensure_response( $purchases );
	}
}
