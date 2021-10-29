<?php
/**
 * The Search Rest Controller class.
 * Registers the REST routes for Search.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;
use WP_Error;
use WP_REST_Server;

/**
 * Registers the REST routes for Search.
 */
class REST_Controller {
	/**
	 * Registers the REST routes for Search.
	 *
	 * @access public
	 * @static
	 */
	public function register_rest_routes() {
		register_rest_route(
			'jetpack/v4',
			'/search/plan',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'search_plan' ),
				'permission_callback' => array( $this, 'search_permissions_callback' ),
			)
		);
	}

	/**
	 * Only administrators can access the API.
	 *
	 * @access public
	 * @static
	 *
	 * @return bool|WP_Error True if a blog token was used to sign the request, WP_Error otherwise.
	 */
	public function search_permissions_callback() {
		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack'
		);

		return new WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Proxy the request to WPCOM and return the response.
	 */
	public function search_plan() {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			'/sites/' . $blog_id . '/jetpack-search/plan',
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return null;
		}

		if ( 200 !== $response['response']['code'] ) {
			return null;
		}

		return rest_ensure_response(
			json_decode( $response['body'], true )
		);
	}

	// TODO the module / instant search read/write API.

}
