<?php

jetpack_require_lib( 'class.media' );

new WPCOM_JSON_API_Edit_Media_v1_2_Endpoint( array(
	'description' => 'Edit a media item.',
	'group'       => 'media',
	'stat'        => 'media:1:POST',
	'min_version' => '1',
	'max_version' => '1.2',
	'method'      => 'POST',
	'path'        => '/sites/%s/media/%d/edit',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$media_ID' => '(int) The ID of the media item',
	),

	'request_format' => array(
		'parent_id'   => '(int) ID of the post this media is attached to',
		'title'       => '(string) The file name.',
		'caption'     => '(string) File caption.',
		'description' => '(HTML) Description of the file.',
		'alt'         => "(string) Alternative text for image files.",
		'artist'      => "(string) Audio Only. Artist metadata for the audio track.",
		'album'       => "(string) Audio Only. Album metadata for the audio track.",
		'media'       => "(object) An object file to attach to the post. To upload media, " .
		                   "the entire request should be multipart/form-data encoded. " .
		                   "Multiple media items will be displayed in a gallery. Accepts " .
		                   "jpg, jpeg, png, gif, pdf, doc, ppt, odt, pptx, docx, pps, ppsx, xls, xlsx, key. " .
		                   "Audio and Video may also be available. See <code>allowed_file_types</code> " .
		                   "in the options response of the site endpoint. " .
		                   "<br /><br /><strong>Example</strong>:<br />" .
						   "<code>curl \<br />--form 'title=Image' \<br />--form 'media=@/path/to/file.jpg' \<br />-H 'Authorization: BEARER your-token' \<br />'https://public-api.wordpress.com/rest/v1/sites/123/posts/new'</code>",
		'attrs'       => "(object) An Object of attributes (`title`, `description` and `caption`) " .
		                   "are supported to assign to the media uploaded via the `media` or `media_url`",
		'media_url'   => "(string) An URL of the image to attach to a post.",
	),

	'response_format' => array(
		'ID'               => '(int) The ID of the media item',
		'date'             => '(ISO 8601 datetime) The date the media was uploaded',
		'post_ID'          => '(int) ID of the post this media is attached to',
		'author_ID'        => '(int) ID of the user who uploaded the media',
		'URL'              => '(string) URL to the file',
		'guid'             => '(string) Unique identifier',
		'file'             => '(string) File name',
		'extension'        => '(string) File extension',
		'mime_type'        => '(string) File mime type',
		'title'            => '(string) File name',
		'caption'          => '(string) User provided caption of the file',
		'description'      => '(string) Description of the file',
		'alt'              => '(string)  Alternative text for image files.',
		'thumbnails'       => '(object) Media item thumbnail URL options',
		'height'           => '(int) (Image & video only) Height of the media item',
		'width'            => '(int) (Image & video only) Width of the media item',
		'length'           => '(int) (Video & audio only) Duration of the media item, in seconds',
		'exif'             => '(array) (Image & audio only) Exif (meta) information about the media item',
		'videopress_guid'  => '(string) (Video only) VideoPress GUID of the video when uploaded on a blog with VideoPress',
		'videopress_processing_done'  => '(bool) (Video only) If the video is uploaded on a blog with VideoPress, this will return the status of processing on the video.',
		'revision_history' => '(object) An object with `items` and `original` keys. ' .
		                        '`original` is an object with data about the original image. ' .
		                        '`items` is an array of snapshots of the previous images of this Media. ' .
		                        'Each item has the `URL`, `file, `extension`, `date`, and `mime_type` fields.'
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1.2/sites/82974409/media/446',
	'example_request_data' =>  array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'title' => 'Updated Title'
		)
	)
) );

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

