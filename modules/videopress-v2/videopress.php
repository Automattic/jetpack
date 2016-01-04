<?php

/**
 * Get details about a specific video by GUID:
 * @param $guid string
 * @return object
 */
function videopress_get_video_details( $guid ) {
	if ( preg_match( '/^[a-z\d]+$/i', $guid ) ) {
		return new WP_Error( 'bad-guid', __( 'Invalid Video GUID! Only letters and numbers.', 'jetpack' ) );;
	}

	$endpoint = sprintf( '/videos/%1$s', $guid );
	$version  = '1.1';
	$args     = array();

	$response = Jetpack_Client::wpcom_json_api_request_as_blog( $endpoint, $version, $args );
	$data     = json_decode( wp_remote_retrieve_body( $response ) );

	return apply_filters( 'videopress_get_video_details', $data );
}
