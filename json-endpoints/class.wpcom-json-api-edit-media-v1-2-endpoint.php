<?php

jetpack_require_lib( 'class.media' );

const REVISION_HISTORY_MAXIMUM_AMOUNT = 0;
const WP_ATTACHMENT_IMAGE_ALT = '_wp_attachment_image_alt';

class WPCOM_JSON_API_Edit_Media_v1_2_Endpoint extends WPCOM_JSON_API_Update_Media_v1_1_Endpoint {
	/**
	 * Return an array of mime_type items allowed when the media file is uploaded.
	 * 	
	 * @return {Array} mime_type array
	 */
	static function get_allowed_mime_types( $default_mime_types ) {
		return array_unique( array_merge( $default_mime_types, array(
			'application/msword',                                                         // .doc
			'application/vnd.ms-powerpoint',                                              // .ppt, .pps
			'application/vnd.ms-excel',                                                   // .xls
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',  // .pptx
			'application/vnd.openxmlformats-officedocument.presentationml.slideshow',     // .ppsx
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',          // .xlsx
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',    // .docx
			'application/vnd.oasis.opendocument.text',                                    // .odt
			'application/pdf',                                                            // .pdf
		) ) );
	}

	/**
	 * Update the media post grabbing the post values from
	 * the `attrs` parameter
	 *
	 * @param  {Number} $media_id - post media ID
	 * @param  {Object} $attrs - `attrs` parameter sent from the client in the request body
	 * @return
	 */
	private function update_by_attrs_parameter( $media_id, $attrs ) {
		$insert = array();

		// Attributes: Title, Caption, Description
		if ( isset( $attrs['title'] ) ) {
			$insert['post_title'] = $attrs['title'];
		}

		if ( isset( $attrs['caption'] ) ) {
			$insert['post_excerpt'] = $attrs['caption'];
		}

		if ( isset( $attrs['description'] ) ) {
			$insert['post_content'] = $attrs['description'];
		}

		if ( ! empty( $insert ) ) {
			$insert['ID'] = $media_id;
			$update_action = wp_update_post( (object) $insert );
			if ( is_wp_error( $update_action ) ) {
				return $update_action;
			}
		}

		// Attributes: Alt
		if ( isset( $attrs['alt'] ) ) {
			$alt = wp_strip_all_tags( $attrs['alt'], true );
			$post_update_action = update_post_meta( $media_id, WP_ATTACHMENT_IMAGE_ALT, $alt );

			if ( is_wp_error( $post_update_action ) ) {
				return $post_update_action;
			}
		}

		// Attributes: Artist, Album
		$id3_meta = array();

		foreach ( array( 'artist', 'album' ) as $key ) {
			if ( isset( $attrs[ $key ] ) ) {
				$id3_meta[ $key ] = wp_strip_all_tags( $attrs[ $key ], true );
			}
		}

		if ( ! empty( $id3_meta ) ) {
			// Before updating metadata, ensure that the item is audio
			$item = $this->get_media_item_v1_1( $media_id );
			if ( 0 === strpos( $item->mime_type, 'audio/' ) ) {
				$update_action = wp_update_attachment_metadata( $media_id, $id3_meta );
				if ( is_wp_error( $update_action ) ) {
					return $update_action;
				}
			}
		}

		return $post_update_action;
	}

	/**
	 * Return an object to be used to store into the revision_history
	 * 
	 * @param  {Object} $media_item - media post object
	 * @return {Object} the snapshot object 
	 */
	private function get_snapshot( $media_item ) {
		$current_file = get_attached_file( $media_item->ID );
		$file_paths = pathinfo( $current_file );

		$snapshot = array(
			'date'             => (string) $this->format_date( $media_item->post_modified_gmt, $media_item->post_modified ),
			'URL'              => (string) wp_get_attachment_url( $media_item->ID ),
			'file'             => (string) $file_paths['basename'],
			'extension'        => (string) $file_paths['extension'],
			'mime_type'        => (string) $media_item->post_mime_type,
			'size'             => (int) filesize( $current_file ) 
		);

		return (object) $snapshot;
	}

	/**
	 * Try to remove the temporal file from the given file array.
	 * 	
	 * @param  {Array} $file_array - Array with data about the temporal file
	 * @return {Boolean} `true` if the file has been removed.
	 *                   `false` either the file doesn't exist or it couldn't be removed.
	 */
	private function remove_tmp_file( $file_array ) {
		if ( ! file_exists ( $file_array['tmp_name'] ) ) {
			return false;
		}
		return @unlink( $file_array['tmp_name'] );
	}

	/**
	 * Save the given temporal file in a local folder.
	 * 
	 * @param  {Array} $file_array
	 * @param  {Number} $media_id
	 * @return {Array|WP_Error} An array with information about the new file saved or a WP_Error is something went wrong.
	 */
	private function save_temporary_file( $file_array, $media_id ) {
		$tmp_filename = $file_array['tmp_name'];

		if ( ! file_exists( $tmp_filename ) ) {
			return new WP_Error( 'invalid_input', 'No media provided in input.' );
		}

		// add additional mime_types through of the `jetpack_supported_media_sideload_types` filter
		$mime_type_static_filter = array(
			'WPCOM_JSON_API_Edit_Media_v1_2_Endpoint',
			'get_allowed_mime_types'
		);

		add_filter( 'jetpack_supported_media_sideload_types', $mime_type_static_filter );
		if (
			! $this->is_file_supported_for_sideloading( $tmp_filename ) &&
			! file_is_displayable_image( $tmp_filename )
		) {
			@unlink( $tmp_filename );
			return new WP_Error( 'invalid_input', 'Invalid file type.', 403 );
		}
		remove_filter( 'jetpack_supported_media_sideload_types', $mime_type_static_filter );

		// generate a new file name
		$tmp_new_filename = Media::generate_new_filename( $media_id, $file_array[ 'name' ] );

		// start to create the parameters to move the temporal file
		$overrides = array( 'test_form' => false );

		$time = $this->get_time_string_from_guid( $media_id );

		$file_array['name'] = $tmp_new_filename;
		$file = wp_handle_sideload( $file_array, $overrides, $time );

		$this->remove_tmp_file( $file_array );

		if ( isset( $file['error'] ) ) {
			return new WP_Error( 'upload_error', $file['error'] );
		}

		return $file;
	}

	/**
	 * File urls use the post date to generate a folder path.
	 * Post dates can change, so we use the original date used in the guid
	 * url so edits can remain in the same folder. In the following function
	 * we capture a string in the format of `YYYY/MM` from the guid.
	 *
	 * For example with a guid of
	 * "http://test.files.wordpress.com/2016/10/test.png" the resulting string
	 * would be: "2016/10"
	 *
	 * @param $media_id
	 *
	 * @return string
	 */
	private function get_time_string_from_guid( $media_id ) {
		$time = date( "Y/m", strtotime( current_time( 'mysql' ) ) );
		if ( $media = get_post( $media_id ) ) {
			$pattern = '/\/(\d{4}\/\d{2})\//';
			preg_match( $pattern, $media->guid, $matches );
			if ( count( $matches ) > 1 ) {
				$time = $matches[1];
			}
		}
		return $time;
	}

	/**
	 * Get the image from a remote url and then save it locally.
	 *
	 * @param  {Number} $media_id - media post ID
	 * @param  {String} $url - image URL to save locally
	 * @return {Array|WP_Error} An array with information about the new file saved or a WP_Error is something went wrong.
	 */
	private function build_file_array_from_url( $media_id, $url ) {
		if ( ! $url ) {
			return null;
		}

	// if we didn't get a URL, let's bail
		$parsed = @parse_url( $url );
		if ( empty( $parsed ) ) {
			return new WP_Error( 'invalid_url', 'No media provided in url.' );
		}

		// save the remote image into a tmp file
		$tmp = download_url( wpcom_get_private_file( $url ) );
		if ( is_wp_error( $tmp ) ) {
			return $tmp;
		}

		return array(
			'name' => basename( $url ),
			'tmp_name' => $tmp
		);
	}

	/**
	 * Add a new item into revision_history array.
	 * 
	 * @param  {Object} $media_item         - media post
	 * @param  {file} $file               - file recentrly added
	 * @param  {Boolean} $has_original_media - condition is the original media has been already added
	 * @return {Boolean} `true` if the item has been added. Otherwise `false`.
	 */
	private function register_revision( $media_item, $file, $has_original_media ) {
		if (
			is_wp_error( $file ) ||
			! $has_original_media
		) {
			return false;
		}

		add_post_meta( $media_item->ID, Media::$WP_REVISION_HISTORY, $this->get_snapshot( $media_item ) );
	}

	function callback( $path = '', $blog_id = 0, $media_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$media_item = get_post( $media_id );

		if ( ! $media_item || is_wp_error( $media_item ) ) {
			return new WP_Error( 'unknown_media', 'Unknown Media', 404 );
		}

		if ( ! current_user_can( 'upload_files', $media_id ) ) {
			return new WP_Error( 'unauthorized', 'User cannot view media', 403 );
		}

		$input = $this->input( true );

		// images
		$media_file = $input['media'] ? (array) $input['media'] : null;
		$media_url = $input['media_url'];
		$media_attrs = $input['attrs'] ? (array) $input['attrs'] : null;

		if ( isset( $media_url ) || $media_file ) {
			$user_can_upload_files = current_user_can( 'upload_files' ) || $this->api->is_authorized_with_upload_token();

			if ( ! $user_can_upload_files  ) {
				return new WP_Error( 'unauthorized', 'User cannot upload media.', 403 );
			}

			$has_original_media = Media::get_original_media( $media_id );

			if ( ! $has_original_media ) {
				// The first time that the media is updated
				// the original media is stored into the revision_history
				$snapshot = $this->get_snapshot( $media_item );
				add_post_meta( $media_id, Media::$WP_ORIGINAL_MEDIA, $snapshot, true );
			}

			// save the temporal file locally 
			$temporal_file = $media_file ? $media_file : $this->build_file_array_from_url( $media_id, $media_url );

			if ( is_wp_error( $temporal_file ) ) {
				return $temporal_file;
			}

			$uploaded_file = $this->save_temporary_file( $temporal_file, $media_id );

			if ( is_wp_error( $uploaded_file ) ) {
				return $uploaded_file;
			}

			// revision_history control
			$this->register_revision( $media_item, $uploaded_file, $has_original_media );

			$uploaded_path = $uploaded_file['file'];
			$udpated_mime_type = $uploaded_file['type'];
			$was_updated = update_attached_file( $media_id, $uploaded_path );

			if ( $was_updated ) {
				$new_metadata = wp_generate_attachment_metadata( $media_id, $uploaded_path );
				wp_update_attachment_metadata( $media_id, $new_metadata );

				// check maximum amount of revision_history
				Media::limit_revision_history( $media_id, REVISION_HISTORY_MAXIMUM_AMOUNT );

				wp_update_post( (object) array(
					ID                  => $media_id,
					'post_mime_type'    => $udpated_mime_type
				) );
			}

			unset( $input['media'] );
			unset( $input['media_url'] );
			unset( $input['attrs'] );
		}

		// update media through of `attrs` value it it's defined
		if ( ( $media_file || isset( $media_url ) ) && $media_attrs ) {
			$was_updated = $this->update_by_attrs_parameter( $media_id, $media_attrs );

			if ( is_wp_error( $was_updated ) ) {
				return $was_updated;
			}
		}

		// call parent method
		$response = parent::callback( $path, $blog_id, $media_id );

		// expose `revision_history` object
		$response->revision_history = (object) array(
			'items'       => (array) Media::get_revision_history( $media_id ),
			'original'    => (object) Media::get_original_media( $media_id )
		);

		return $response;
	}
}

