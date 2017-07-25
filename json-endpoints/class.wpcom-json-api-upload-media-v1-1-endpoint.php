<?php
class WPCOM_JSON_API_Upload_Media_v1_1_Endpoint extends WPCOM_JSON_API_Endpoint {

	/**
	 * @param string $path
	 * @param int $blog_id
	 *
	 * @return array|int|WP_Error|void
	 */
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! current_user_can( 'upload_files' ) && ! $this->api->is_authorized_with_upload_token() ) {
			return new WP_Error( 'unauthorized', 'User cannot upload media.', 403 );
		}

		$input = $this->input( true );

		$media_files = ! empty( $input['media'] ) ? $input['media'] : array();
		$media_urls = ! empty( $input['media_urls'] ) ? $input['media_urls'] : array();
		$media_attrs = ! empty( $input['attrs'] ) ? $input['attrs'] : array();

		if ( empty( $media_files ) && empty( $media_urls ) ) {
			return new WP_Error( 'invalid_input', 'No media provided in input.' );
		}

		$is_jetpack_site = false;
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			// For jetpack sites, we send the media via a different method, because the sync is very different.
			$jetpack_sync = Jetpack_Media_Sync::summon( $blog_id );
			$is_jetpack_site = $jetpack_sync->is_jetpack_site();
		}

		$jetpack_media_files = array();
		$other_media_files   = array();
		$media_items         = array();
		$errors              = array();

		// We're splitting out videos for Jetpack sites
		foreach ( $media_files as $media_item ) {
			if ( preg_match( '@^video/@', $media_item['type'] ) && $is_jetpack_site ) {
				$jetpack_media_files[] = $media_item;

			} else {
				$other_media_files[] = $media_item;
			}
		}

		// New Jetpack / VideoPress media upload processing
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			if ( count( $jetpack_media_files ) > 0 ) {
				add_filter( 'upload_mimes', array( $this, 'allow_video_uploads' ) );

				$media_items = $jetpack_sync->upload_media( $jetpack_media_files, $this->api );

				$errors = $jetpack_sync->get_errors();

				foreach ( $media_items as & $media_item ) {
					// More than likely a post has not been created yet, so we pass in the media item we
					// got back from the Jetpack site.
					$post       = (object) $media_item['post'];
					$media_item = $this->get_media_item_v1_1( $post->ID, $post, $media_item['file'] );
				}
			}
		}

        // Normal WPCOM upload processing
        if ( count( $other_media_files ) > 0 || count( $media_urls ) > 0 ) {
	        $create_media = $this->handle_media_creation_v1_1( $other_media_files, $media_urls, $media_attrs );
	        $media_ids = $create_media['media_ids'];
	        $errors = $create_media['errors'];

	        $media_items = array();
	        foreach ( $media_ids as $media_id ) {
		        $media_items[] = $this->get_media_item_v1_1( $media_id );
	        }
        }

		if ( count( $media_items ) <= 0 ) {
			return $this->api->output_early( 400, array( 'errors' => $errors ) );
		}

		$results = array();
		foreach ( $media_items as $media_item ) {
			if ( is_wp_error( $media_item ) ) {
				$errors[] =  array( 'file' => $media_item['ID'], 'error' => $media_item->get_error_code(), 'message' => $media_item->get_error_message() );

			} else {
				$results[] = $media_item;
			}
		}

		$response = array( 'media' => $results );

		if ( count( $errors ) > 0 ) {
			$response['errors'] = $errors;
		}

		return $response;
	}

	/**
	 * Force to use the WPCOM API instead of proxy back to the Jetpack API if the blog is a paid Jetpack
	 * blog w/ the VideoPress module enabled AND the uploaded file is a video.
	 *
	 * @param int $blog_id
	 * @return bool
	 */
	function force_wpcom_request( $blog_id ) {

		// We don't need to do anything if VideoPress is not enabled for the blog.
		if ( ! is_videopress_enabled_on_jetpack_blog( $blog_id ) ) {
			return false;
		}

		// Check to see if the upload is not a video type, if not then return false.
		$input = $this->input( true );
		$media_files = ! empty( $input['media'] ) ? $input['media'] : array();

		foreach ( $media_files as $media_item ) {
			if ( ! preg_match( '@^video/@', $media_item['type'] ) ) {
				return false;
			}
		}

		// The API request should be for a blog w/ Jetpack, A valid plan, has VideoPress enabled,
		// and is a video file. Let's let it through.
		return true;
	}
}
