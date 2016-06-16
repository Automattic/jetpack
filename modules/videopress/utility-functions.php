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
 *
 * @param $guid string
 * @return object
 */
function videopress_get_video_details( $guid ) {
	if ( ! videopress_is_valid_guid( $guid ) ) {
		return new WP_Error( 'bad-guid-format', __( 'Invalid Video GUID!', 'jetpack' ) );
	}

	$version  = '1.1';
	$endpoint = sprintf( '/videos/%1$s', $guid );
	$response = wp_remote_get( sprintf( 'https://public-api.wordpress.com/rest/v%1$s%2$s', $version, $endpoint ) );
	$data     = json_decode( wp_remote_retrieve_body( $response ) );

	/**
	 * Allow functions to modify fetched video details.
	 *
	 * This filter allows third-party code to modify the return data
	 * about a given video.  It may involve swapping some data out or
	 * adding new parameters.
	 *
	 * @since 4.0.0
	 *
	 * @param object $data The data returned by the WPCOM API. See: https://developer.wordpress.com/docs/api/1.1/get/videos/%24guid/
	 * @param string $guid The GUID of the VideoPress video in question.
	 */
	return apply_filters( 'videopress_get_video_details', $data, $guid );
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
	$wp_upload_dir = wp_upload_dir();
	// Strip out protocols, so it doesn't fail because searching for http: in https: dir.
	$dir = set_url_scheme( trailingslashit( $wp_upload_dir['baseurl'] ), 'relative' );

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

/**
 * Return an absolute URI for a given filename and guid on the CDN.
 * No check is performed to ensure the guid exists or the file is present. Simple centralized string builder.
 *
 * @param string $guid VideoPress identifier
 * @param string $filename name of file associated with the guid (video file name or thumbnail file name)
 * @return string Absolute URL of VideoPress file for the given guid.
 */
function video_cdn_file_url( $guid, $filename ) {
	if ( is_ssl() ) {
		return "https://videos.files.wordpress.com/{$guid}/{$filename}";

	} else {
		return "http://videos.videopress.com/{$guid}/{$filename}";
	}
}


/**
 * Wrapper function to extract the status of a particular clip from the database row.
 *
 * @param array $info single row from the videos table
 * @param string $format named video format
 * @return string format status string, or empty string if no match
 */
function videopress_format_status( $info, $format ){

	if ( empty( $info ) || empty( $format ) || ! videopress_is_valid_format($format) ) {
		return '';
	}

	if ( $format == 'fmt_std'  || $format == 'fmt_dvd' || $format == 'fmt_hd' ) {
		return $info->$format;

	} elseif ( $format == 'fmt1_ogg' ) {
		if ( empty( $info->fmts_ogg ) ) {
			return '';
		}

		$r = preg_match( '/fmt1_ogg:([\w-]+);/', $info->fmts_ogg, $m );
		if ( $r === 0 || $r === false ) {
			return '';
		} else {
			return $m[1];
		}
	}
}


/**
 * Defines valid named format types
 *
 * @param string $format named video format checked against master list
 * @return bool true if given named format is valid, else false
 **/
function videopress_is_valid_format($format) {
	static $valid_formats = array( 'fmt_std', 'fmt_dvd', 'fmt_hd', 'fmt1_ogg' );
	if ( !empty( $format ) && in_array( $format, $valid_formats ) ) {
		return true;

	} else {
		return false;
	}
}