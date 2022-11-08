<?php
/**
 * VideoPress Site Privacy Setting Endpoint
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Error;
use WP_REST_Response;
use WP_REST_Server;

/**
 * VideoPress rest api class for fetching and setting site privacy options
 */
class VideoPress_Rest_Api_V1_Site_Privacy_Setting {
	/**
	 * Initializes the endpoints
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'rest_api_init', array( static::class, 'register_rest_endpoints' ) );
	}

	/**
	 * Register the REST API routes.
	 *
	 * @return void
	 */
	public static function register_rest_endpoints() {
		register_rest_route(
			'videopress/v1',
			'site-privacy-setting',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( static::class, 'get_privacy_setting' ),
					'permission_callback' => function () {
						return current_user_can( 'manage_options' );
					},
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( static::class, 'update_privacy_setting' ),
					'permission_callback' => function () {
						return current_user_can( 'manage_options' );
					},
					'args'                => array(
						'videopress_videos_private_for_site' => array(
							'description'       => __( 'If the VideoPress videos should be private by default', 'jetpack-videopress-pkg' ),
							'type'              => 'boolean',
							'required'          => true,
							'sanitize_callback' => 'rest_sanitize_boolean',
						),
					),
				),
			)
		);
	}

	/**
	 * Returns the value of the VideoPress privacy setting, a boolean
	 * stating if the videos are private or not.
	 *
	 * @return WP_Rest_Response - The response object.
	 */
	public static function get_privacy_setting() {
		$has_connected_owner = Data::has_connected_owner();
		if ( ! $has_connected_owner ) {
			return rest_ensure_response(
				new WP_Error(
					'owner_not_connected',
					'User not connected.',
					array(
						'code'        => 503,
						'connect_url' => Admin_UI::get_admin_page_url(),
					)
				)
			);
		}

		$blog_id = Data::get_blog_id();
		if ( ! $blog_id ) {
			return rest_ensure_response(
				new WP_Error( 'site_not_registered', 'Site not registered.', 503 )
			);
		}

		$status = 200;
		$data   = array(
			'videopress_videos_private_for_site' => get_option( 'videopress_private_enabled_for_site', false ) ? true : false,
		);

		return rest_ensure_response(
			new WP_REST_Response( $data, $status )
		);
	}

	/**
	 * Updates the value of the VideoPress privacy setting, defining
	 * if the videos should be private by default or not.
	 *
	 * @param WP_REST_Request $request the request object.
	 * @return WP_Rest_Response - The response object.
	 */
	public static function update_privacy_setting( $request ) {
		$has_connected_owner = Data::has_connected_owner();
		if ( ! $has_connected_owner ) {
			return rest_ensure_response(
				new WP_Error(
					'owner_not_connected',
					'User not connected.',
					array(
						'code'        => 503,
						'connect_url' => Admin_UI::get_admin_page_url(),
					)
				)
			);
		}

		$blog_id = Data::get_blog_id();
		if ( ! $blog_id ) {
			return rest_ensure_response(
				new WP_Error( 'site_not_registered', 'Site not registered.', 503 )
			);
		}

		$json_params = $request->get_json_params();

		// We are sure that the param is set because it's required by the request
		update_option( 'videopress_private_enabled_for_site', boolval( $json_params['videopress_videos_private_for_site'] ) );

		return rest_ensure_response(
			array(
				'code'    => 'success',
				'message' => __( 'VideoPress privacy setting updated successfully.', 'jetpack-videopress-pkg' ),
				'data'    => 200,
			)
		);
	}
}
