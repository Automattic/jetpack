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
			'/search',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_search_results' ),
				'permission_callback' => 'is_user_logged_in',
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
			'2'
		);

		$this->maybe_update_search_plan_option( $response );

		return $this->make_proper_response( $response );
	}

	/**
	 * POST `jetpack/v4/search/settings`
	 *
	 * @param WP_REST_Request $request - REST request.
	 */
	public function update_settings( $request ) {
		$request_body = $request->get_json_params();

		$module_active          = isset( $request_body['module_active'] ) ? $request_body['module_active'] : null;
		$instant_search_enabled = isset( $request_body['instant_search_enabled'] ) ? $request_body['instant_search_enabled'] : null;

		if ( ( true === $instant_search_enabled && false === $module_active ) || ( is_null( $module_active ) && is_null( $instant_search_enabled ) ) ) {
			return new WP_Error( 'rest_invalid_arguments', 'The arguments passed in are invalid.', array( 'status' => 400 ) );
		}

		if ( false === $module_active ) {
			$instant_search_enabled = false;
		} elseif ( true === $instant_search_enabled ) {
			$module_active = true;
		}

		if ( ! is_null( $module_active ) && Module_Control::get_instance()->is_active() !== $module_active ) {
			if ( $module_active ) {
				Module_Control::get_instance()->activate();
			} else {
				Module_Control::get_instance()->deactivate();
			}
		}

		if ( ! is_null( $instant_search_enabled ) && Module_Control::get_instance()->is_instant_search_enabled() !== $instant_search_enabled ) {
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
			'module_active'          => Module_Control::get_instance()->is_active(),
			'instant_search_enabled' => Module_Control::get_instance()->is_instant_search_enabled(),
		);
	}

	/**
	 * Search Endpoint for private sites.
	 *
	 * GET `jetpack/v4/search`
	 *
	 * @param WP_REST_Request $request - REST request.
	 */
	public function get_search_results( $request ) {
		$blog_id  = $this->get_blog_id();
		$path     = sprintf( '/sites/%d/search', absint( $blog_id ) );
		$path     = add_query_arg(
			$request->get_query_params(),
			sprintf( '/sites/%d/search', absint( $blog_id ) )
		);
		$response = Client::wpcom_json_api_request_as_user( $path, '1.3', array(), null, 'rest' );
		return $this->make_proper_response( $response );
	}

	/**
	 * Forward remote response to client with error handling.
	 *
	 * @param array|WP_Error $response - Resopnse from WPCOM.
	 */
	protected function make_proper_response( $response ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body        = json_decode( wp_remote_retrieve_body( $response ) );
		$status_code = wp_remote_retrieve_response_code( $response );

		if ( 200 === $status_code ) {
			return $body;
		}

		return new WP_Error(
			'remote-error-' . $body->error,
			$body->message,
			array( 'status' => $status_code )
		);
	}

	/**
	 * Get blog id
	 */
	protected function get_blog_id() {
		return $this->is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
	}

	/**
	 * Update `has_jetpack_search_product` regarding the plan information
	 *
	 * @param array|WP_Error $response - Resopnse from WPCOM.
	 */
	protected function maybe_update_search_plan_option( $response ) {
		if ( is_wp_error( $response || ! isset( $response['supports_instant_search'] ) ) ) {
			return null;
		}
		if ( get_option( 'has_jetpack_search_product' ) === (bool) $response['supports_instant_search'] ) {
			return null;
		}
		return update_option( 'has_jetpack_search_product', (bool) $response['supports_instant_search'] );
	}

}
