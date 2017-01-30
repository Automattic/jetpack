<?php

jetpack_require_lib( 'class.media' );

class WPCOM_JSON_API_Get_Media_v1_2_Endpoint extends WPCOM_JSON_API_Get_Media_v1_1_Endpoint {
	function callback( $path = '', $blog_id = 0, $media_id = 0 ) {
		$response = parent::callback( $path, $blog_id, $media_id );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$media_item = get_post( $media_id );
		$response->modified = (string) $this->format_date( $media_item->post_modified_gmt, $media_item->post_modified );

		// expose `revision_history` object
		$response->revision_history = (object) array(
			'items'       => (array) Media::get_revision_history( $media_id ),
			'original'    => (object) Media::get_original_media( $media_id )
		);

		return $response;
	}
}

