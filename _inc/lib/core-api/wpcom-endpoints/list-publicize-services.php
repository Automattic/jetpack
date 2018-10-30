<?php

/**
 * Publicize: get available publicize connection services data.
 */
class WPCOM_REST_API_V2_Endpoint_List_Publicize_Services {
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes() {
		register_rest_route( 'wpcom/v2', '/publicize/services', array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_data' ),
				'permission_callback' => __CLASS__ . '::permission_check',
			),
		) );
	}

	public function get_data( $request ) {
		global $publicize;
		return $publicize->rest_get_publicize_available_services();
	}
	/**
	 * Verify that user can publish posts.
	 *
	 * @since 6.7.0
	 *
	 * @return bool Whether user has the capability 'publish_posts'.
	 */
	public static function permission_check() {
		if ( current_user_can( 'publish_posts' ) ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_publicize',
			Jetpack_Core_Json_Api_Endpoints::$user_permissions_error_msg,
			array( 'status' => Jetpack_Core_Json_Api_Endpoints::rest_authorization_required_code() )
		);	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_List_Publicize_Services' );

