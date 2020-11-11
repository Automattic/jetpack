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
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_option' ),
					'permission_callback' => array( $this, 'get_option_permissions_check' ),
					'args'                => array(
						'option' => array(
							'description'       => __( 'User option name.', 'jetpack' ),
							'type'              => 'string',
							'required'          => 'true',
							'validate_callback' => function ( $param ) {
								return is_string( $param ) && ! is_numeric( $param );
							},
						),
					),
				),
			)
		);
	}


	/**
	 * Checks if a given request has access to admin menus.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the item, WP_Error object otherwise.
	 */
	public function get_option_permissions_check( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		// https://wordpress.org/support/article/roles-and-capabilities/#read
		if ( ! current_user_can( 'read' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to read user options on this site.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}



	/**
	 * Retrieves the admin menu.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_option( $request ) {

		if ( empty( $request['option'] ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You must provide a valid option.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		$option_key = $request['option'];

		$option = get_user_option( $option_key );

		if ( false === $option ) {
			return new WP_Error(
				'rest_forbidden',
				__( "No option found with key '$option_key'.", 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return rest_ensure_response( $option );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_User_Option' );
