<?php
/**
 * This is the endpoint class for `/site` endpoints.
 *
 */
class Jetpack_Core_API_Site_Endpoint {

	/**
	 * Returns the result of `/sites/%s/features` endpoint call.
	 * @return object $features has 'active' and 'available' properties each of which contain feature slugs.
	 *                  'active' is a simple array of slugs that are active on the current plan.
	 *                  'available' is an object with keys that represent feature slugs and values are arrays
	 *                     of plan slugs that enable these features
	 */
	public static function get_features() {

		// Make the API request
		$request = sprintf( '/sites/%d/features', Jetpack_Options::get_option( 'id' ) );
		$response = Jetpack_Client::wpcom_json_api_request_as_blog( $request, '1.1' );

		// Bail if there was an error or malformed response
		if ( is_wp_error( $response ) || ! is_array( $response ) || ! isset( $response['body'] ) ) {
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
				array( 'status' => 500 )
			);
		}

		// Decode the results
		$results = json_decode( $response['body'], true );

		// Bail if there were no results or plan details returned
		if ( ! is_array( $results ) ) {
			return new WP_Error(
				'failed_to_fetch_data',
				esc_html__( 'Unable to fetch the requested data.', 'jetpack' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response( array(
				'code' => 'success',
				'message' => esc_html__( 'Site features correctly received.', 'jetpack' ),
				'data' => wp_remote_retrieve_body( $response ),
			)
		);
	}

	/**
	 * Check that the current user has permissions to request information about this site.
	 *
	 * @since 5.1.0
	 *
	 * @return bool
	 */
	public static function can_request() {
		return current_user_can( 'jetpack_manage_modules' );
	}
}
