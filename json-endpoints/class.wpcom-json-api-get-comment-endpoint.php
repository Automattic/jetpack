<?php

class WPCOM_JSON_API_Get_Comment_Endpoint extends WPCOM_JSON_API_Comment_Endpoint {
	// /sites/%s/comments/%d -> $blog_id, $comment_id
	function callback( $path = '', $blog_id = 0, $comment_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$args = $this->query_args();

		$return = $this->get_comment( $comment_id, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		do_action( 'wpcom_json_api_objects', 'comments' );

		return $return;
	}
}
