<?php

jetpack_require_lib( 'class.media' );

class WPCOM_JSON_API_Edit_Media_v1_2_Endpoint extends WPCOM_JSON_API_Update_Media_v1_1_Endpoint {
	/**
	 * Update the media post grabbing the post values from
	 * the `attrs` parameter
	 *
	 * @param  {Number} $media_id - post media ID
	 * @param  {Object} $attrs - `attrs` parameter sent from the client in the request body
	 * @return bool|WP_Error `WP_Error` on failure. `true` on success.
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
				$update_action;
			}
		}

		// Attributes: Alt
		if ( isset( $attrs['alt'] ) ) {
			$alt = wp_strip_all_tags( $attrs['alt'], true );
			update_post_meta( $media_id, Jetpack_Media::$WP_ATTACHMENT_IMAGE_ALT, $alt );
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
				wp_update_attachment_metadata( $media_id, $id3_meta );
			}
		}

		return $update_action;
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
		$tmp = download_url( $url );
		if ( is_wp_error( $tmp ) ) {
			return $tmp;
		}

		return array(
			'name' => basename( $url ),
			'tmp_name' => $tmp
		);
	}

	function callback( $path = '', $blog_id = 0, $media_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$media_item = get_post( $media_id );

		if ( ! $media_item ) {
			return new WP_Error( 'unknown_media', 'Unknown Media', 404 );
		}

		if ( is_wp_error( $media_item ) ) {
			return $media_item;
		}

		if ( ! current_user_can( 'upload_files', $media_id ) ) {
			return new WP_Error( 'unauthorized', 'User cannot view media', 403 );
		}

		$input = $this->input( true );

		// images
		$media_url = $input['media_url'];
		$media_attrs = $input['attrs'] ? (array) $input['attrs'] : null;

		if ( isset( $media_url ) ) {
			$user_can_upload_files = current_user_can( 'upload_files' ) || $this->api->is_authorized_with_upload_token();

			if ( ! $user_can_upload_files  ) {
				return new WP_Error( 'unauthorized', 'User cannot upload media.', 403 );
			}

			// save the temporal file locally 
			$temporal_file = $this->build_file_array_from_url( $media_id, $media_url );

			$edited_media_item = Jetpack_Media::edit_media_file( $media_id, $temporal_file );

			if ( is_wp_error( $edited_media_item ) ) {
				return $edited_media_item;
			}

			unset( $input['media'] );
			unset( $input['media_url'] );
			unset( $input['attrs'] );

			// update media through of `attrs` value it it's defined
			if ( $media_attrs ) {
				$updated_by_attrs = $this->update_by_attrs_parameter( $media_id, $media_attrs );

				if ( is_wp_error( $updated_by_attrs ) ) {
					return $updated_by_attrs;
				}
			}
		}

		// call parent method
		$response = parent::callback( $path, $blog_id, $media_id );

		// expose `revision_history` object
		$response->revision_history = (object) array(
			'items'       => (array) Jetpack_Media::get_revision_history( $media_id ),
			'original'    => (object) Jetpack_Media::get_original_media( $media_id )
		);

		return $response;
	}
}

