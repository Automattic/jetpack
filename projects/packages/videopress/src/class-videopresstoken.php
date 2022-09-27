<?php
/**
 * VideoPress Uploader
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;
use WP_REST_Response;

/**
 * VideoPress token utility class
 */
class VideoPressToken {
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
	 * Check if user is connected.
	 *
	 * @return bool
	 * @throws Upload_Exception - If user is not connected.
	 */
	private static function check_connection() {
		if ( ! ( new Connection_Manager() )->has_connected_owner() ) {
			throw new Upload_Exception( __( 'You need to connect Jetpack before being able to upload a video to VideoPress.', 'jetpack-videopress-pkg' ) );
		}
		return true;
	}

	/**
	 * Get current blog id.
	 *
	 * @return string - Blog id.
	 */
	public static function blog_id() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$blog_id = get_current_blog_id();
		} else {
			$blog_id = Jetpack_Options::get_option( 'id' );
		}

		return $blog_id;
	}

	/**
	 * Retrieve a Playback JWT via WPCOM api.
	 *
	 * @param string $guid The VideoPress GUID.
	 * @return string
	 */
	public static function videopress_playback_jwt( $guid ) {
		$blog_id = static::blog_id();

		$args = array(
			'method' => 'POST',
		);

		$endpoint = "sites/{$blog_id}/media/videopress-playback-jwt/{$guid}";

		$result = Client::wpcom_json_api_request_as_blog( $endpoint, 'v2', $args, null, 'wpcom' );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$response = json_decode( $result['body'], true );

		if ( empty( $response['metadata_token'] ) ) {
			return false;
		}

		return $response['metadata_token'];
	}

	/**
	 * Retrieve a One Time Upload Token via WPCOM api.
	 *
	 * @return string
	 * @throws Upload_Exception If token is empty or is had an error.
	 */
	public static function videopress_onetime_upload_token() {
		if ( static::check_connection() ) {
			$blog_id = static::blog_id();

			$args = array(
				'method' => 'POST',
			);

			$endpoint = "sites/{$blog_id}/media/token";
			$result   = Client::wpcom_json_api_request_as_blog( $endpoint, Client::WPCOM_JSON_API_VERSION, $args );

			if ( is_wp_error( $result ) ) {
				throw new Upload_Exception( __( 'Could not obtain a VideoPress upload token. Please try again later.', 'jetpack-videopress-pkg' ) );
			}

			$response = json_decode( $result['body'], true );

			if ( empty( $response['upload_token'] ) ) {
				throw new Upload_Exception( __( 'Could not obtain a VideoPress upload token. Please try again later.', 'jetpack-videopress-pkg' ) );
			}

			return $response['upload_token'];
		}
	}

	/**
	 * Gets the VideoPress Upload JWT
	 *
	 * @return string
	 * @throws Upload_Exception - If user is not connected, if token is empty or failed to obtain.
	 */
	public static function videopress_upload_jwt() {
		if ( static::check_connection() ) {
			$blog_id  = static::blog_id();
			$endpoint = "sites/{$blog_id}/media/videopress-upload-jwt";
			$args     = array( 'method' => 'POST' );
			$result   = Client::wpcom_json_api_request_as_blog( $endpoint, 'v2', $args, null, 'wpcom' );

			if ( is_wp_error( $result ) ) {
				throw new Upload_Exception(
					__( 'Could not obtain a VideoPress upload JWT. Please try again later.', 'jetpack-videopress-pkg' ) .
					'(' . $result->get_error_message() . ')'
				);
			}

			$response = json_decode( $result['body'], true );

			if ( empty( $response['upload_token'] ) ) {
				throw new Upload_Exception( __( 'Could not obtain a VideoPress upload JWT. Please try again later. (empty upload token)', 'jetpack-videopress-pkg' ) );
			}

			return $response['upload_token'];
		}
	}

	/**
	 * Endpoint for getting the VideoPress Upload JWT
	 *
	 * @return WP_Rest_Response - The response object.
	 */
	public static function upload_jwt() {
		$blog_id = static::blog_id();

		try {
			$token  = static::videopress_upload_jwt();
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
