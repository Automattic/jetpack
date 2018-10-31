<?php

/**
 * Publicize: get connection list data for current user and post id.
 */
class WPCOM_REST_API_V2_Endpoint_Get_Post_Publicize_Connections {
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	public function register_routes() {
		register_rest_route( 'wpcom/v2', '/publicize/posts/(?P<post_id>\d+)/connections', array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_publicize_connections_for_post' ),
				'permission_callback' => __CLASS__ . '::permission_check',
			),
		) );
	}


	/**
	 * Retrieve current list of connected social accounts for a given post.
	 *
	 * Gets current list of connected accounts and send them as
	 * JSON encoded data.
	 *
	 * @see Publicize::get_filtered_connection_data()
	 *
	 * @since 6.7.0
	 *
	 * @param WP_REST_Request $request Request instance from REST call.
	 *
	 * @return string JSON encoded connection list data.
	 */
	public function get_publicize_connections_for_post( $request ) {
		global $publicize;

		$post_id = $request['post_id'];
		return $publicize->get_filtered_connection_data( $post_id );
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

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Get_Post_Publicize_Connections' );
