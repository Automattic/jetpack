<?php

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
