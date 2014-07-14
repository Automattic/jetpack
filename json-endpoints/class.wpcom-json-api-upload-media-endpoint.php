<?php

class WPCOM_JSON_API_Upload_Media_Endpoint extends WPCOM_JSON_API_Endpoint {
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( !current_user_can( 'upload_files', $media_id ) ) {
			return new WP_Error( 'unauthorized', 'User cannot upload media.', 403 );
		}

		$input = $this->input( true );

		$has_media = isset( $input['media'] ) && $input['media'] ? count( $input['media'] ) : false;
		$media_ids = $files = array();

		if ( $has_media ) {
			$this->api->trap_wp_die( 'upload_error' );
			foreach ( $input['media'] as $media_item ) {
				$_FILES['.api.media.item.'] = $media_item;
				// check for WP_Error if we ever actually need $media_id
				$media_id = media_handle_upload( '.api.media.item.', 0 );
				$media_ids[] = $media_id;
				$files[] = $media_item;
			}
			$this->api->trap_wp_die( null );

			unset( $_FILES['.api.media.item.'] );
		}

		$has_media_urls = isset( $input['media_urls'] ) && $input['media_urls'] ? count( $input['media_urls'] ) : false;
		if ( $has_media_urls ) {
			foreach ( $input['media_urls'] as $url ) {
				$id = $this->handle_media_sideload( $url );
				if ( ! empty( $id ) )
					$media_ids[] = $id;
			}
		}

		$results = array();
		foreach ( $media_ids as $media_id ) {
			$results[] = $this->get_media_item( $media_id );
		}

		return array( 'media' => $results );
	}
}
