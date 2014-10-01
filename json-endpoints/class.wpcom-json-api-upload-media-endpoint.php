<?php

class WPCOM_JSON_API_Upload_Media_Endpoint extends WPCOM_JSON_API_Endpoint {
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! current_user_can( 'upload_files' ) ) {
			return new WP_Error( 'unauthorized', 'User cannot upload media.', 403 );
		}

		$input = $this->input( true );

		$has_media      = isset( $input['media'] ) && $input['media'] ? count( $input['media'] ) : false;
		$has_media_urls = isset( $input['media_urls'] ) && $input['media_urls'] ? count( $input['media_urls'] ) : false;

		$media_ids = $files = $errors = array();

		if ( $has_media ) {
			$this->api->trap_wp_die( 'upload_error' );
			foreach ( $input['media'] as $index => $media_item ) {
				$_FILES['.api.media.item.'] = $media_item;
				// check for WP_Error if we ever actually need $media_id
				$media_id = media_handle_upload( '.api.media.item.', 0 );
				if ( is_wp_error( $media_id ) ) {
					if ( 1 === count( $input['media'] ) && ! $has_media_urls ) {
						unset( $_FILES['.api.media.item.'] );
						return $media_id;
					}
					$errors[ $index ]['error']   = $media_id->get_error_code();
					$errors[ $index ]['message'] = $media_id->get_error_message();
				} else {
					$media_ids[ $index ] = $media_id;
				}
				$files[] = $media_item;
			}
			$this->api->trap_wp_die( null );

			unset( $_FILES['.api.media.item.'] );
		}

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

		return array( 'media' => $results, 'errors' => $errors );
	}
}
