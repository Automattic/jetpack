<?php
/**
 * REST API endpoint for editing Jetpack Transients.
 *
 * @package automattic/jetpack
 * @since 9.7.0
 */

/**
 * Edit and delete transients.
 *
 * @since 9.7.0
 */
class WPCOM_REST_API_V2_Endpoint_Transient extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'transients';
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Called automatically on `rest_api_init()`.
	 *
	 * /sites/<blog-id>/transients/$name/delete
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<name>\w{1,172})',
			array(
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_transient' ),
					'permission_callback' => 'is_user_logged_in',
					'name'                => array(
						'description' => __( 'The name of the transient to delete.', 'jetpack' ),
						'type'        => 'string',
					),
				),
			)
		);
	}

	/**
	 * Delete callback for transient.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return array|WP_Error
	 */
	public function delete_transient( \WP_REST_Request $request ) {
		$name = rawurlencode( $request->get_param( 'name' ) );

		if ( $name ) {
			return array(
				'success' => delete_transient( $name ),
			);
		} else {
			return new WP_Error( 'missing_transient', 'No transient provided.' );
		}
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Transient' );
