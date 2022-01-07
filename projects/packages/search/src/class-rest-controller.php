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
	 * Module Control object.
	 *
	 * @var Module_Control
	 */
	protected $search_module;

	/**
	 * Constructor
	 *
	 * @param bool                $is_wpcom - Whether it's run on WPCOM.
	 * @param Module_Control|null $module_control - Module_Control object if any.
	 */
	public function __construct( $is_wpcom = false, $module_control = null ) {
		$this->is_wpcom      = $is_wpcom;
		$this->search_module = is_null( $module_control ) ? new Module_Control() : $module_control;
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
			'jetpack-search-pkg'
		);

		return new WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Proxy the request to WPCOM and return the response.
	 *
	 * GET `jetpack/v4/search/plan`
	 */
	public function get_search_plan() {
		$response = ( new Plan() )->get_plan_info_from_wpcom();
		return $this->make_proper_response( $response );
	}

	/**
	 * POST `jetpack/v4/search/settings`
	 *
	 * @param WP_REST_Request $request - REST request.
	 */
	public function update_settings( $request ) {
		$request_body = $request->get_json_params();

		$module_active          = isset( $request_body['module_active'] ) ? (bool) $request_body['module_active'] : null;
		$instant_search_enabled = isset( $request_body['instant_search_enabled'] ) ? (bool) $request_body['instant_search_enabled'] : null;

		$error = $this->validate_search_settings( $module_active, $instant_search_enabled );

		if ( is_wp_error( $error ) ) {
			return $error;
		}

		// Enabling instant search should enable the module too.
		if ( true === $instant_search_enabled && true !== $module_active ) {
			$module_active = true;
		}

		$errors = array();
		if ( ! is_null( $module_active ) ) {
			$module_active_updated = $this->search_module->update_status( $module_active );
			if ( is_wp_error( $module_active_updated ) ) {
				$errors['module_active'] = $module_active_updated;
			}
		}

		if ( ! is_null( $instant_search_enabled ) ) {
			$instant_search_enabled_updated = $this->search_module->update_instant_search_status( $instant_search_enabled );
			if ( is_wp_error( $instant_search_enabled_updated ) ) {
				$errors['instant_search_enabled'] = $instant_search_enabled_updated;
			}
		}

		if ( ! empty( $errors ) ) {
			return new WP_Error(
				'some_updated',
				sprintf(
					/* translators: %s are the setting name that not updated. */
					__( 'Some settings ( %s ) not updated.', 'jetpack-search-pkg' ),
					implode(
						',',
						array_keys( $errors )
					)
				),
				array( 'status' => 400 )
			);
		}

		return $this->get_settings();
	}

	/**
	 * Validate $module_active and $instant_search_enabled. Returns an WP_Error instance if invalid.
	 *
	 * @param boolean $module_active - Module status.
	 * @param boolean $instant_search_enabled - Instant Search status.
	 */
	protected function validate_search_settings( $module_active, $instant_search_enabled ) {
		if ( ( true === $instant_search_enabled && false === $module_active ) || ( is_null( $module_active ) && is_null( $instant_search_enabled ) ) ) {
			return new WP_Error(
				'rest_invalid_arguments',
				esc_html__( 'The arguments passed in are invalid.', 'jetpack-search-pkg' ),
				array( 'status' => 400 )
			);
		}
		return true;
	}

	/**
	 * GET `jetpack/v4/search/settings`
	 */
	public function get_settings() {
		return array(
			'module_active'          => $this->search_module->is_active(),
			'instant_search_enabled' => $this->search_module->is_instant_search_enabled(),
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
