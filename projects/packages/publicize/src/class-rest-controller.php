<?php
/**
 * The Publicize Rest Controller class.
 * Registers the REST routes for Publicize.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;
use WP_Error;
use WP_REST_Server;

/**
 * Registers the REST routes for Search.
 */
class REST_Controller {
	/**
	 * Whether it's run on WPCOM.
	 *
	 * @var bool
	 */
	protected $is_wpcom;

	/**
	 * Constructor
	 *
	 * @param bool $is_wpcom - Whether it's run on WPCOM.
	 */
	public function __construct( $is_wpcom = false ) {
		$this->is_wpcom = $is_wpcom;

	}

	/**
	 * Registers the REST routes for Search.
	 *
	 * @access public
	 * @static
	 */
	public function register_rest_routes() {
		register_rest_route(
			'jetpack/v4',
			'/publicize/connections',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_publicize_connections' ),
				'permission_callback' => array( $this, 'require_admin_privilege_callback' ),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/publicize/shares-count',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_publicize_shares_count' ),
				'permission_callback' => array( $this, 'require_admin_privilege_callback' ),
			)
		);
	}

	/**
	 * Only administrators can access the API.
	 *
	 * @return bool|WP_Error True if a blog token was used to sign the request, WP_Error otherwise.
	 */
	public function require_admin_privilege_callback() {
		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-publicize-pkg'
		);

		return new WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Gets the current Publicize connections for the site.
	 *
	 * GET `jetpack/v4/publicize/connections`
	 */
	public function get_publicize_connections() {
		$blog_id  = $this->get_blog_id();
		$path     = sprintf( '/sites/%d/publicize/connections', absint( $blog_id ) );
		$response = Client::wpcom_json_api_request_as_user( $path, '2', array(), null, 'wpcom' );
		return rest_ensure_response( $this->make_proper_response( $response ) );
	}

	/**
	 * Gets the publicize shares count for the site.
	 *
	 * GET `jetpack/v4/publicize/shares-count`
	 */
	public function get_publicize_shares_count() {
		$blog_id  = $this->get_blog_id();
		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( 'sites/%d/shares-count', absint( $blog_id ) ),
			'2',
			array(
				'headers' => array( 'content-type' => 'application/json' ),
				'method'  => 'GET',
			),
			null,
			'wpcom'
		);

		return rest_ensure_response( $this->make_proper_response( $response ) );
	}

	/**
	 * Forward remote response to client with error handling.
	 *
	 * @param array|WP_Error $response - Response from WPCOM.
	 */
	protected function make_proper_response( $response ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body        = json_decode( wp_remote_retrieve_body( $response ), true );
		$status_code = wp_remote_retrieve_response_code( $response );

		if ( 200 === $status_code ) {
			return $body;
		}

		return new WP_Error(
			isset( $body['error'] ) ? 'remote-error-' . $body['error'] : 'remote-error',
			isset( $body['message'] ) ? $body['message'] : 'unknown remote error',
			array( 'status' => $status_code )
		);
	}

	/**
	 * Get blog id
	 */
	protected function get_blog_id() {
		return $this->is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
	}
}
