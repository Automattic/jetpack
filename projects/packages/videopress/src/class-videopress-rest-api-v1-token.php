<?php
/**
 * VideoPress Token Endpoints
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_REST_Response;

/**
 * VideoPress token rest api class
 */
class VideoPress_Rest_Api_V1_Token {
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
			'upload-jwt',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => static::class . '::upload_jwt',
				'permission_callback' => static::class . '::permissions_callback',
			)
		);
	}

	/**
	 * Checks wether the user have permission to perform the upload
	 *
	 * @return boolean
	 */
	public static function permissions_callback() {
		return current_user_can( 'upload_files' );
	}

	/**
	 * Endpoint for getting the VideoPress Upload JWT
	 *
	 * @return WP_Rest_Response - The response object.
	 */
	public static function upload_jwt() {
		$blog_id = VideoPressToken::blog_id();

		try {
			$token  = VideoPressToken::videopress_upload_jwt();
			$status = 200;
			$data   = array(
				'upload_token'   => $token,
				'upload_url'     => videopress_make_resumable_upload_path( $blog_id ),
				'upload_blog_id' => $blog_id,
			);
		} catch ( \Exception $e ) {
			// TODO: Improve status code.
			$status = 500;
			$data   = array(
				'error' => $e->getMessage(),
			);

		}

		return rest_ensure_response(
			new WP_REST_Response( $data, $status )
		);
	}
}
