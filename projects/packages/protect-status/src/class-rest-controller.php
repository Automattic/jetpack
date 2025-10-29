<?php
/**
 * Class file for managing REST API endpoints for package protect-status.
 *
 * @package automattic/jetpack-protect-status
 */

namespace Automattic\Jetpack\Protect_Status;

use Automattic\Jetpack\Connection\Rest_Authentication;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Class REST_Controller
 */
class REST_Controller {

	/**
	 * Initialize the plugin's REST API.
	 *
	 * @return void
	 */
	public static function init() {
		// Set up the REST authentication hooks.
		Rest_Authentication::init();

		// Add custom WP REST API endoints.
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_endpoints' ) );
	}

	/**
	 * Register the REST API routes.
	 *
	 * @return void
	 */
	public static function register_rest_endpoints() {
		register_rest_route(
			'jetpack-protect/v1',
			'check-plan',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::api_check_plan',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'status',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::api_get_status',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'clear-scan-cache',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::api_clear_scan_cache',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}

	/**
	 * Return site plan data for the API endpoint
	 *
	 * @return WP_REST_Response
	 */
	public static function api_check_plan() {
		$has_required_plan = Plan::has_required_plan();

		return rest_ensure_response( $has_required_plan );
	}

	/**
	 * Return Protect Status for the API endpoint
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public static function api_get_status( $request ) {
		$status = Status::get_status( $request['hard_refresh'] );
		return rest_ensure_response( $status );
	}

	/**
	 * Clear the Scan_Status cache for the API endpoint
	 *
	 * @return WP_REST_Response
	 */
	public static function api_clear_scan_cache() {
		$cache_cleared = Scan_Status::delete_option();

		if ( ! $cache_cleared ) {
			return new WP_REST_Response( 'An error occurred while attempting to clear the Jetpack Scan cache.', 500 );
		}

		return new WP_REST_Response( 'Jetpack Scan cache cleared.' );
	}
}
