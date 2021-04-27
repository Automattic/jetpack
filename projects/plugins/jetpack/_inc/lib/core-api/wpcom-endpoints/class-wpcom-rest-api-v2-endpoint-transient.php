<?php
/**
 * REST API endpoint for editing Jetpack Transients.
 *
 * @package automattic/jetpack
 * @since 9.7.0
 */

/**
 * Jetpack transients API.
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
	 */
	public function register_routes() {
		// DELETE /sites/<blog-id>/transients/$name route.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<name>\w{1,172})',
			array(
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_transient' ),
					'permission_callback' => array( $this, 'delete_transient_permissions_check' ),
					'args'                => array(
						'name' => array(
							'description'       => __( 'The name of the transient to delete.', 'jetpack' ),
							'required'          => true,
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
			)
		);
	}

	/**
	 * Delete transient callback.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return array|WP_Error
	 */
	public function delete_transient( \WP_REST_Request $request ) {
		$transient_name = $request->get_param( 'name' );
		if ( false !== strpos( $transient_name, 'jetpack_connected_user_data_' ) &&
			wp_get_current_user()->ID === (int) substr( $transient_name, 28 ) ) {
				return array(
					'success' => delete_transient( $transient_name ),
				);
		} else {
			return new WP_Error(
				'rest_cannot_delete',
				__( 'Sorry, you are not allowed to delete this transient.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}
	}

	/**
	 * Check if request has read access.
	 *
	 * @return bool
	 */
	public function delete_transient_permissions_check() {
		return current_user_can( 'read' );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Transient' );
