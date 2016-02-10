<?php

class WPCOM_JSON_API_Delete_Media_v1_1_Endpoint extends WPCOM_JSON_API_Endpoint {
	function callback( $path = '', $blog_id = 0, $media_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! current_user_can( 'delete_post', $media_id ) ) {
			return new WP_Error( 'unauthorized', 'User is not authorized delete media', 403 );
		}

		$item = $this->get_media_item_v1_1( $media_id );

		if ( is_wp_error( $item ) ) {
			return new WP_Error( 'unknown_media', 'Unknown Media', 404 );
		}

		wp_delete_post( $media_id, true );
		$item->status = 'deleted';
		return $item;
	}
}
