<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Proxies requests to the WPCOM API endpoint to generate images.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;

/**
 * This is the endpoint class for `/generate-image` endpoint.
 */
class Jetpack_Generate_Image_Endpoint {
	/**
	 * Returns the result of `/sites/%s/generate-image` endpoint call.
	 *
	 * @param WP_REST_Request $request The API request with the ID parameter.
	 * @return object
	 */
	public function get_image( $request ) {
		// Make the API request.
		$request  = sprintf( '/sites/%d/jetpack-generate-image/%s', Jetpack_Options::get_option( 'id' ), $request['id'] );
		$response = Client::wpcom_json_api_request_as_blog(
			$request,
			'2',
			array(),
			null,
			'wpcom'
		);
		$body     = json_decode( wp_remote_retrieve_body( $response ) );
		return rest_ensure_response( $body, 200 );
	}

	/**
	 * Returns the result of a post request to `/sites/%s/generate-image` endpoint call.
	 *
	 * @param WP_REST_Request $request The API request with the prompt to use for the generation.
	 * @return array of site purchases.
	 */
	public function generate_image( $request ) {
		// Make the API request.
		$path     = sprintf( '/sites/%d/jetpack-generate-image', Jetpack_Options::get_option( 'id' ) );
		$response = Client::wpcom_json_api_request_as_blog(
			$path,
			'2',
			array(
				'method' => 'POST',
			),
			array(
				'prompt'              => $request['prompt'],
				'force_model_refresh' => ! empty( $request['force_model_refresh'] ),
			),
			'wpcom'
		);
		$body     = json_decode( wp_remote_retrieve_body( $response ) );
		return rest_ensure_response( $body, 200 );
	}

	/**
	 * Checks if the current user can make a request to this endpoint.
	 *
	 * @return bool True if the user can make a request.
	 */
	public function can_request() {
		return current_user_can( 'jetpack_manage_modules' );
	}
}
