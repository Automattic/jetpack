<?php

class WPCOM_JSON_API_Get_Media_Endpoint extends WPCOM_JSON_API_Endpoint {
	function callback( $path = '', $blog_id = 0, $media_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		//upload_files can probably be used for other endpoints but we want contributors to be able to use media too
		if ( !current_user_can( 'edit_posts', $media_id ) ) {
			return new WP_Error( 'unauthorized', 'User cannot view media', 403 );
		}

		return $this->get_media_item( $media_id );
	}
}
