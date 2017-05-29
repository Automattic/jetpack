<?php

jetpack_require_lib( 'class.media' );

class WPCOM_JSON_API_List_Media_v1_2_Endpoint extends WPCOM_JSON_API_List_Media_v1_1_Endpoint {
	function callback( $path = '', $blog_id = 0 ) {
		$response = parent::callback( $path, $blog_id );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$media_list = $response['media'];

		if ( count( $media_list ) < 1 ) {
			return $response;
		}

		foreach ( $media_list as $index => $media_item ) {
			// expose `revision_history` object for each image
			$media_item->revision_history = (object) array(
				'items'       => (array) Media::get_revision_history( $media_item->ID ),
				'original'    => (object) Media::get_original_media( $media_item->ID )
			);
		}

		return $response;
	}
}

