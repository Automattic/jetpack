<?php
/**
 * We won't have any videos less than sixty pixels wide. That would be silly.
 */
defined( 'VIDEOPRESS_MIN_WIDTH' ) or define( 'VIDEOPRESS_MIN_WIDTH', 60 );

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
 * Similar to `media_sideload_image` -- but returns an ID.
 *
 * @param $url
 * @param $attachment_id
 *
 * @return int|mixed|object|WP_Error
 */
function videopress_download_poster_image( $url, $attachment_id ) {
	// Set variables for storage, fix file filename for query strings.
	preg_match( '/[^\?]+\.(jpe?g|jpe|gif|png)\b/i', $url, $matches );
	if ( ! $matches ) {
		return new WP_Error( 'image_sideload_failed', __( 'Invalid image URL' ) );
	}

	$file_array = array();
	$file_array['name']     = basename( $matches[0] );
	$file_array['tmp_name'] = download_url( $url );

	// If error storing temporarily, return the error.
	if ( is_wp_error( $file_array['tmp_name'] ) ) {
		return $file_array['tmp_name'];
	}

	// Do the validation and storage stuff.
	$thumbnail_id = media_handle_sideload( $file_array, $attachment_id, null );

	// Flag it as poster image, so we can exclude it from display.
	update_post_meta( $thumbnail_id, 'videopress_poster_image', 1 );

	return $thumbnail_id;
}

/**
 * Creates a local media library item of a remote VideoPress video.
 *
 * @param $guid
 * @param int $parent_id
 *
 * @return int|object
 */
function create_local_media_library_for_videopress_guid( $guid, $parent_id = 0 ) {
	$vp_data = videopress_get_video_details( $guid );
	if ( ! $vp_data || is_wp_error( $vp_data ) ) {
		return $vp_data;
	}

	$args = array(
		'post_date'      => $vp_data->upload_date,
		'post_title'     => wp_kses( $vp_data->title, array() ),
		'post_content'   => wp_kses( $vp_data->description, array() ),
		'post_mime_type' => 'video/videopress',
		'guid'           => sprintf( 'https://videopress.com/v/%s', $guid ),
	);

	$attachment_id = wp_insert_attachment( $args, null, $parent_id );

	if ( ! is_wp_error( $attachment_id ) ) {
		update_post_meta( $attachment_id, 'videopress_guid', $guid );
		wp_update_attachment_metadata( $attachment_id, array(
			'width'  => $vp_data->width,
			'height' => $vp_data->height,
		) );

		$thumbnail_id = videopress_download_poster_image( $vp_data->poster, $attachment_id );
		update_post_meta( $attachment_id, '_thumbnail_id', $thumbnail_id );
	}

	return $attachment_id;
}

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	/**
	 * Manage and import VideoPress videos.
	 */
	class VideoPress_CLI extends WP_CLI_Command {
		/**
		 * Import a VideoPress Video
		 *
		 * ## OPTIONS
		 *
		 * <guid>: Import the video with the specified guid
		 *
		 * ## EXAMPLES
		 *
		 * wp videopress import kUJmAcSf
		 *
		 */
		public function import( $args ) {
			$guid = $args[0];
			$attachment_id = create_local_media_library_for_videopress_guid( $guid );
			if ( $attachment_id && ! is_wp_error( $attachment_id ) ) {
				WP_CLI::success( sprintf( __( 'The video has been imported as Attachment ID %d', 'jetpack' ), $attachment_id ) );
			} else {
				WP_CLI::error( __( 'An error has been encountered.', 'jetpack' ) );
			}
		}
	}
	WP_CLI::add_command( 'videopress', 'VideoPress_CLI' );
}

/**
 * Return an absolute URI for a given filename and guid on the CDN.
 * No check is performed to ensure the guid exists or the file is present. Simple centralized string builder.
 *
 * @param string $guid     VideoPress identifier
 * @param string $filename name of file associated with the guid (video file name or thumbnail file name)
 *
 * @return string Absolute URL of VideoPress file for the given guid.
 */
function videopress_cdn_file_url( $guid, $filename ) {
	if ( is_ssl() ) {
		return "https://videos.files.wordpress.com/{$guid}/{$filename}";

	} else {
		return "http://videos.videopress.com/{$guid}/{$filename}";
	}
}

/**
 * Get an array of the transcoding status for the given video post.
 *
 * @param int $post_id
 * @return array|bool Returns an array of statuses if this is a VideoPress post, otherwise it returns false.
 */
function videopress_get_transcoding_status( $post_id ) {
	$meta = wp_get_attachment_metadata( $post_id );

	// If this has not been processed by videopress, we can skip the rest.
	if ( !$meta || ! isset( $meta['videopress'] ) ) {
		return false;
	}

	$info = (object) $meta['videopress'];

	$status = array(
		'std_mp4' => isset( $info->files_status ) ? $info->files_status['std']['mp4'] : null,
		'std_ogg' => isset( $info->files_status ) ? $info->files_status['std']['ogg'] : null,
		'dvd_mp4' => isset( $info->files_status ) ? $info->files_status['dvd']['mp4'] : null,
		'hd_mp4'  => isset( $info->files_status ) ? $info->files_status['hd']['mp4'] : null,
	);

	return $status;
}

