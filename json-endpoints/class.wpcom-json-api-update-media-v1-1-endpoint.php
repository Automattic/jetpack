<?php

new WPCOM_JSON_API_Update_Media_v1_1_Endpoint( array(
	'description' => 'Edit basic information about a media item.',
	'group'       => 'media',
	'stat'        => 'media:1:POST',
	'min_version' => '1.1',
	'max_version' => '1.1',
	'method'      => 'POST',
	'path'        => '/sites/%s/media/%d',
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
	),

	'response_format' => array(
		'ID'               => '(int) The ID of the media item',
		'date'             => '(ISO 8601 datetime) The date the media was uploaded',
		'post_ID'          => '(int) ID of the post this media is attached to',
		'author_ID'        => '(int) ID of the user who uploaded the media',
		'URL'              => '(string) URL to the file',
		'guid'             => '(string) Unique identifier',
		'file'			   => '(string) File name',
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
		'videopress_processing_done'  => '(bool) (Video only) If the video is uploaded on a blog with VideoPress, this will return the status of processing on the video.'
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/media/446',
	'example_request_data' =>  array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'title' => 'Updated Title'
		)
	)
) );

class WPCOM_JSON_API_Update_Media_v1_1_Endpoint extends WPCOM_JSON_API_Endpoint {
	function callback( $path = '', $blog_id = 0, $media_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! current_user_can( 'upload_files', $media_id ) ) {
			return new WP_Error( 'unauthorized', 'User cannot view media', 403 );
		}

		$item = $this->get_media_item_v1_1( $media_id );

		if ( is_wp_error( $item ) ) {
			return new WP_Error( 'unknown_media', 'Unknown Media', 404 );
		}

		$input = $this->input( true );
		$insert = array();

		if ( isset( $input['title'] ) ) {
			$insert['post_title'] = $input['title'];
		}

		if ( isset( $input['caption'] ) ) {
			$insert['post_excerpt'] = $input['caption'];
		}

		if ( isset( $input['description'] ) ) {
			$insert['post_content'] = $input['description'];
		}

		if ( isset( $input['parent_id'] ) ) {
			$insert['post_parent'] = $input['parent_id'];
		}

		if ( isset( $input['alt'] ) ) {
			$alt = wp_strip_all_tags( $input['alt'], true );
			update_post_meta( $media_id, '_wp_attachment_image_alt', $alt );
		}

		// audio only artist/album info
		if ( 0 === strpos( $item->mime_type, 'audio/' ) ) {
			$changed = false;
			$id3data = wp_get_attachment_metadata( $media_id );

			if ( ! is_array( $id3data ) ) {
				$changed = true;
				$id3data = array();
			}

			$id3_keys = array(
				'artist' => __( 'Artist', 'jetpack' ),
				'album' => __( 'Album', 'jetpack' )
			);

			foreach ( $id3_keys as $key => $label ) {
				if ( isset( $input[ $key ] ) ) {
					$changed = true;
					$id3data[ $key ] = wp_strip_all_tags( $input[ $key ], true );
				}
			}

			if ( $changed ) {
				wp_update_attachment_metadata( $media_id, $id3data );
			}
		}

		$insert['ID'] = $media_id;
		wp_update_post( (object) $insert );

		$item = $this->get_media_item_v1_1( $media_id );
		return $item;
	}
}
