<?php

class WPCOM_JSON_API_Bulk_Delete_Post_Endpoint extends WPCOM_JSON_API_Update_Post_v1_1_Endpoint {
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$input = $this->input();

		$post_ids = (array) $input['post_ids'];

		$result = array(
			'results' => array(),
		);

		foreach( $post_ids as $post_id ) {
			$result['results'][ $post_id ] = $this->delete_post( $path, $blog_id, $post_id );
		}

		return $result;
	}
}
