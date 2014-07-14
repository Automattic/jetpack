<?php

class WPCOM_JSON_API_Update_Media_Endpoint extends WPCOM_JSON_API_Endpoint {
	function callback( $path = '', $blog_id = 0, $media_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( !current_user_can( 'upload_files', $media_id ) ) {
			return new WP_Error( 'unauthorized', 'User cannot view media', 403 );
		}

		$item = $this->get_media_item( $media_id );

		if ( is_wp_error( $item ) ) {
			return new WP_Error( 'unknown_media', 'Unknown Media', 404 );
		}

		$input = $this->input( true );
		$insert = array();

		if ( !empty( $input['title'] ) ) {
			$insert['post_title'] = $input['title'];
		}

		if ( !empty( $input['caption'] ) )
			$insert['post_excerpt'] = $input['caption'];

		if ( !empty( $input['description'] ) )
			$insert['post_content'] = $input['description'];

		$insert['ID'] = $media_id;
		wp_update_post( (object) $insert );

		$item = $this->get_media_item( $media_id );
		return $item;
	}
}
