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
use WP_REST_Request;
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
				'callback'            => array( $this, 'get_search_plan' ),
				'permission_callback' => array( $this, 'search_permissions_callback' ),
			)
		);
		register_rest_route(
			'jetpack/v4',
			'/search/settings',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_settings' ),
				'permission_callback' => array( $this, 'search_permissions_callback' ),
			)
		);
		register_rest_route(
			'jetpack/v4',
			'/search/settings',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_settings' ),
				'permission_callback' => array( $this, 'search_permissions_callback' ),
			)
		);
		register_rest_route(
			'jetpack/v4',
			'/search/',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'search' ),
				// TODO.
				'permission_callback' => array( $this, 'search_permissions_callback' ),
			)
		);
	}

	/**
	 * Only administrators can access the API.
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
	 *
	 * GET `jetpack/v4/search/plan`
	 */
	public function get_search_plan() {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			'/sites/' . $blog_id . '/jetpack-search/plan',
			'v2',
			array( 'blog_id' => 999 ),
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

	/**
	 * POST `jetpack/v4/search/settings`
	 *
	 * @param WP_REST_Request $request - REST request.
	 */
	public function update_settings( $request ) {
		$module_status          = (bool) $request->get_json_params( 'module_status' );
		$instant_search_enabled = (bool) $request->get_json_params( 'instant_search_enabled' );

		if ( Module_Control::get_instance()->is_activated() !== $module_status ) {
			if ( $module_status ) {
				Module_Control::get_instance()->activate();
			} else {
				Module_Control::get_instance()->deactive();
			}
		}

		if ( Module_Control::get_instance()->is_instant_enabled() !== $instant_search_enabled ) {
			if ( $instant_search_enabled ) {
				Module_Control::get_instance()->enable_instant_search();
			} else {
				Module_Control::get_instance()->disable_instant_search();
			}
		}

		return $this->get_settings();
	}

	/**
	 * GET `jetpack/v4/search/settings`
	 */
	public function get_settings() {
		return array(
			'module_status'          => Module_Control::get_instance()->is_activated(),
			'instant_search_enabled' => Module_Control::get_instance()->is_instant_enabled(),
		);
	}

	/**
	 * GET `jetpack/v4/search/search`
	 */
	public function search() {

	}

}
