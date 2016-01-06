<?php

/**
 * Validate user-supplied guid values against expected inputs
 *
 * @since 1.1
 * @param string $guid video identifier
 * @return bool true if passes validation test
 */
public function videopress_is_valid_guid( $guid ) {
	if ( ! empty( $guid ) && strlen( $guid ) === 8 && ctype_alnum( $guid ) ) {
		return true;
	}
	return false;
}

/**
 * Get details about a specific video by GUID:
 * @param $guid string
 * @return object
 */
function videopress_get_video_details( $guid ) {
	if ( ! videopress_is_valid_guid( $guid ) ) {
		return new WP_Error( 'bad-guid-format', __( 'Invalid Video GUID!.', 'jetpack' ) );;
	}

	$version  = '1.1';
	$endpoint = sprintf( '/videos/%1$s', $guid );

//	$response = Jetpack_Client::wpcom_json_api_request_as_blog( $endpoint, $version );
	$response = wp_remote_get( sprintf( 'https://public-api.wordpress.com/rest/v%1$s%2$s', $version, $endpoint ) );
	$data     = json_decode( wp_remote_retrieve_body( $response ) );

	return apply_filters( 'videopress_get_video_details', $data );
}

/**
 * Add some dummy REST API routes for testing.  Delete before merging to master.
 */
add_action( 'rest_api_init', 'videopress_core_json_api_init' );
function videopress_core_json_api_init() {
	if ( Jetpack::is_active() ) {
		register_rest_route( 'jetpack/v4', '/video/(?P<guid>[a-zA-Z\d]+)', array(
			'methods' => 'GET',
			'callback' => 'videopress_core_json_api_get_video_details',
		) );
	}
}
function videopress_core_json_api_get_video_details( $data ) {
	return videopress_get_video_details( $data['guid'] );
}
