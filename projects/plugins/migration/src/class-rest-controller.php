<?php
/**
 * REST API Endpoints
 *
 * @package automattic/jetpack-migration-plugin
 */

namespace Automattic\Jetpack\Migration;

use Automattic\Jetpack\Connection\Client;

/**
 * Makes REST API Endpoints for Migration
 *
 * @package Automattic\Jetpack\Migration
 */
class REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Set up REST API routes.
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	/**
	 * Register REST API
	 */
	public function register_rest_routes() {
		// Get migration status from source site.
		register_rest_route(
			'jetpack/v4',
			'/migration/status',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_migration' ),
				'permission_callback' => array( $this, 'require_admin_privilege_callback' ),
			)
		);
	}

	/**
	 * Gets the current migration for this source site.
	 *
	 * GET `jetpack/v4/migration/status`
	 */
	public function get_migration() {
		$blog_id = \Automattic\Jetpack\Connection\Manager::get_site_id();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$path     = sprintf( '/migrations/from-source/%d', absint( $blog_id ) );
		$response = Client::wpcom_json_api_request_as_user( $path, '2', array(), null, 'wpcom' );
		return rest_ensure_response( $this->make_proper_response( $response ) );
	}

	/**
	 * Only administrators can access the API.
	 *
	 * @return bool|WP_Error True if current user can manage options, WP_Error otherwise.
	 */
	public function require_admin_privilege_callback() {
		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-migration'
		);

		return new \WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Forward remote response to client with error handling.
	 *
	 * @param array|WP_Error $response - Response from WPCOM.
	 */
	private function make_proper_response( $response ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body        = json_decode( wp_remote_retrieve_body( $response ), true );
		$status_code = wp_remote_retrieve_response_code( $response );

		if ( 200 === $status_code ) {
			return $body;
		}

		return new \WP_Error(
			isset( $body['error'] ) ? 'remote-error-' . $body['error'] : 'remote-error',
			isset( $body['message'] ) ? $body['message'] : 'unknown remote error',
			array( 'status' => $status_code )
		);
	}
}
