<?php
require_once( JETPACK__PLUGIN_DIR . 'sal/class.json-api-date.php' );

class WPCOM_JSON_API_Get_Media_v1_2_Endpoint extends WPCOM_JSON_API_Get_Media_v1_1_Endpoint {
	function callback( $path = '', $blog_id = 0, $media_id = 0 ) {
		$response = parent::callback( $path, $blog_id, $media_id );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$media_item = get_post( $media_id );
		$response->modified = WPCOM_JSON_API_Date::format_date( $media_item->post_modified_gmt, $media_item->post_modified );

		// expose `revision_history` object
		$response->revision_history = (object) array(
			'items'       => (array) Jetpack_Media::get_revision_history( $media_id ),
			'original'    => (object) Jetpack_Media::get_original_media( $media_id )
		);

		return $response;
	}
}
