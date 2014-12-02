<?php
class WPCOM_JSON_API_Upload_Media_v1_1_Endpoint extends WPCOM_JSON_API_Endpoint {

	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! current_user_can( 'upload_files' ) ) {
			return new WP_Error( 'unauthorized', 'User cannot upload media.', 403 );
		}

		$input = $this->input( true );

		$media_files = ! empty( $input['media'] ) ? $input['media'] : array();
		$media_urls = ! empty( $input['media_urls'] ) ? $input['media_urls'] : array();
		$media_attrs = ! empty( $input['attrs'] ) ? $input['attrs'] : array();
		if ( empty( $media_files ) && empty( $media_urls ) ) {
			return new WP_Error( 'invalid_input', 'No media provided in input.' );
		}

		$create_media = $this->handle_media_creation_v1_1( $media_files, $media_urls, $media_attrs );
		$media_ids = $create_media['media_ids'];
		$errors = $create_media['errors'];

		$results = array();
		if ( count( $media_ids ) <= 0 ) {
			$this->api->output_early( 400, array( 'errors' => $errors ) );
		} else {
			foreach ( $media_ids as $media_id ) {
				$result = $this->get_media_item_v1_1( $media_id );
				if ( is_wp_error( $result ) ) {
					$errors[] =  array( 'file' => $media_id, 'error' => $result->get_error_code(), 'message' =>  $result->get_error_message() );
				} else {
					$results[] = $result;
				}
			}
			if ( count( $errors ) > 0 ) {
				return array( 'media' => $results, 'errors' => $errors );
			} else {
				return array( 'media' => $results );
			}
		}

	}
}
