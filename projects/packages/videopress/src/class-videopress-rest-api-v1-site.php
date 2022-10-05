<?php
/**
 * VideoPress Site Info Endpoint
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;
use WP_Error;
use WP_REST_Response;

/**
 * VideoPress rest api class for fetching site information
 */
class VideoPress_Rest_Api_V1_Site {
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
			'site',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => static::class . '::get_site_info',
				'permission_callback' => static::class . '::permissions_callback',
			)
		);
	}

	/**
	 * Checks wether the user have permissions to see the site info
	 *
	 * @return boolean
	 */
	public static function permissions_callback() {
		return current_user_can( 'read' ); // TODO: confirm this
	}

	/**
	 * Returns all the site information usually provided by Jetpack, without relying on Jetpack
	 *
	 * @return WP_Rest_Response The response object.
	 */
	public static function get_site_info() {
		$error = new WP_Error(
			'videopress_site_error',
			__( 'Could not fetch site information from the service', 'jetpack-videopress-pkg' )
		);

		$blog_id      = VideoPressToken::blog_id();
		$request_path = sprintf( 'sites/%d?force=wpcom', $blog_id );
		$response     = Client::wpcom_json_api_request_as_blog( $request_path, '1.1', array(), null, 'rest' );

		if ( is_wp_error( $response ) ) {
			return $error;
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $response_code ) {
			return $error;
		}

		$body = wp_remote_retrieve_body( $response );
		return rest_ensure_response( json_decode( $body, true ) );
	}
}
