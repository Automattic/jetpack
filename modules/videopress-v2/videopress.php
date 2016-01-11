<?php

/**
 * Validate user-supplied guid values against expected inputs
 *
 * @since 1.1
 * @param string $guid video identifier
 * @return bool true if passes validation test
 */
function videopress_is_valid_guid( $guid ) {
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

/**
 * Get an attachment ID given a URL.
 *
 * Modified from http://wpscholar.com/blog/get-attachment-id-from-wp-image-url/
 *
 * @todo: Add some caching in here.
 *
 * @param string $url
 *
 * @return int|bool Attachment ID on success, false on failure
 */
function videopress_get_attachment_id_by_url( $url ) {
	// Strip out protocols, so it doesn't fail because searching for http: in https: dir.
	$dir = set_url_scheme( trailingslashit( wp_upload_dir()['baseurl'] ), 'relative' );

	// Is URL in uploads directory?
	if ( false !== strpos( $url, $dir ) ) {

		$file = basename( $url );

		$query_args = array(
			'post_type'   => 'attachment',
			'post_status' => 'inherit',
			'fields'      => 'ids',
			'meta_query'  => array(
				array(
					'key'     => '_wp_attachment_metadata',
					'compare' => 'LIKE',
					'value'   => $file,
				),
			)
		);

		$query = new WP_Query( $query_args );

		if ( $query->have_posts() ) {
			foreach ( $query->posts as $attachment_id ) {
				$meta          = wp_get_attachment_metadata( $attachment_id );
				$original_file = basename( $meta['file'] );
				$cropped_files = wp_list_pluck( $meta['sizes'], 'file' );

				if ( $original_file === $file || in_array( $file, $cropped_files ) ) {
					return (int) $attachment_id;
				}
			}
		}

	}
	return false;
}
