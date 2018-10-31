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
				'callback'            => array( $this, 'get_publicize_available_services' ),
				'permission_callback' => __CLASS__ . '::permission_check',
			),
		) );
	}

	/**
	 * Retrieve full list of available Publicize connection services
	 * send them as JSON encoded data.
	 *
	 * @see Publicize::get_available_service_data()
	 *
	 * @since 6.7.0
	 *
	 * @return string JSON encoded connection services data.
	 */
	public function get_publicize_available_services() {
		global $publicize;
		/**
		 * We need this because Publicize::get_available_service_data() uses `Jetpack_Keyring_Service_Helper`
		 * and `Jetpack_Keyring_Service_Helper` relies on `menu_page_url()`.
		 *
		 * We also need add_submenu_page(), as the URLs for connecting each service
		 * rely on the `sharing` menu subpage being present.
		 */
		include_once( ABSPATH . 'wp-admin/includes/plugin.php' );

		// The `sharing` submenu page must exist for service connect URLs to be correct.
		add_submenu_page( 'options-general.php', '', '', 'manage_options', 'sharing', '__return_empty_string' );

		return $publicize->get_available_service_data();
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
