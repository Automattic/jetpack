<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Example of a WP.com endpoint.
 *
 * @package automattic/jetpack
 */

/**
 * Example endpoint.
 */
class WPCOM_REST_API_V2_Endpoint_Hello {
	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register endpoint route.
	 */
	public function register_routes() {
		register_rest_route(
			'wpcom/v2',
			'/hello',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_data' ),
					'permission_callback' => '__return_true',
				),
			)
		);
	}

	/**
	 * Get data in response to the endpoint request.
	 *
	 * @param WP_REST_Request $request API request.
	 */
	public function get_data( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array( 'hello' => 'world' );
	}
}
wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Hello' );
