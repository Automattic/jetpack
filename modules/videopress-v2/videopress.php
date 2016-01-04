<?php

/**
 * Get details about a specific video by GUID:
 * @param $guid string
 * @return object
 */
function videopress_get_video_details( $guid ) {
	if ( ! preg_match( '/^[a-z\d]+$/i', $guid ) ) {
		return new WP_Error( 'bad-guid', __( 'Invalid Video GUID! Only letters and numbers.', 'jetpack' ) );;
	}

	$endpoint = sprintf( '/videos/%1$s', $guid );
	$version  = '1.1';
	$args     = array();

	$response = Jetpack_Client::wpcom_json_api_request_as_blog( $endpoint, $version, $args );
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
