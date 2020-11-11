<?php
/**
 * REST API endpoint for user options
 *
 * @package Jetpack
 * @since TODO
 */

/**
 * Class WPCOM_REST_API_V2_Endpoint_User_Option
 */
class WPCOM_REST_API_V2_Endpoint_User_Option extends WP_REST_Controller {

	/**
	 * Namespace prefix.
	 *
	 * @var string
	 */
	public $namespace = 'wpcom/v2';

	/**
	 * Endpoint base route.
	 *
	 * @var string
	 */
	public $rest_base = 'user-option';

	/**
	 * WPCOM_REST_API_V2_Endpoint_User_Option constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/',
			array(
				array(
					'methods'  => WP_REST_Server::READABLE,
					'callback' => array( $this, 'get_option' ),
					// 'permission_callback' => array( $this, 'get_option_permissions_check' ),
				),
			)
		);
	}



	/**
	 * Retrieves the admin menu.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_option( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$option = get_user_option( 'admin_color' );
		return rest_ensure_response( $option );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_User_Option' );
