<?php

class WPCOM_JSON_API_List_Media_v1_1_Endpoint extends WPCOM_JSON_API_Endpoint {

	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		//upload_files can probably be used for other endpoints but we want contributors to be able to use media too
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error( 'unauthorized', 'User cannot view media', 403 );
		}

		$args = $this->query_args();

		if ( $args['number'] < 1 ) {
			$args['number'] = 20;
		} elseif ( 100 < $args['number'] ) {
			return new WP_Error( 'invalid_number',  'The NUMBER parameter must be less than or equal to 100.', 400 );
		}

		$media = new WP_Query( array(
			'post_type' => 'attachment',
			'post_status' => 'inherit',
			'post_parent' => $args['parent_id'],
			'offset' => $args['offset'],
			'posts_per_page' => $args['number'],
			'post_mime_type' => $args['mime_type']
		) );

		$response = array();
		foreach ( $media->posts as $item ) {
			$response[] = $this->get_media_item_v1_1( $item->ID );
		}

		$return = array(
			'found' => (int) $media->found_posts,
			'media' => $response
		);

		return $return;
	}

}
