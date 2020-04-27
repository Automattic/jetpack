<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * REST API Endpoint for proxying requests to wpcom.
 *
 * @since 8.4.0
 * @package Jetpack
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Proxy `/integrations/%s` calls to wpcom.
 *
 * @since 8.4.0
 */
class Jetpack_Core_API_Integrations_Proxy {
	/**
	 * Proxy request to wpcom as the current logged in user.
	 *
	 * @param WP_REST_Request $request API request.
	 */
	public function wpcom_request_as_user( WP_REST_Request $request ) {
		$site_id = Jetpack_Options::get_option( 'id' );
		if ( ! $site_id ) {
			return new WP_Error( 'site_id_missing' );
		}

		$integrations_path = $request->get_param( 'path' );
		if ( ! $integrations_path ) {
			return new WP_Error( 'rest_invalid_path' );
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/integrations/%s', $site_id, $integrations_path ),
			'2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_data = json_decode( wp_remote_retrieve_body( $response ) );
		if ( is_string( $response_data ) ) {
			$response_data = array( 'connect_url' => $response_data );
		}

		return rest_ensure_response( $response_data );
	}

	/**
	 * Permissions check for proxied requests.
	 *
	 * Each /integrations endpoint on wpcom should do it's own, more granular, checks.
	 */
	public function user_can_proxy_request() {
		return is_user_logged_in();
	}
}
