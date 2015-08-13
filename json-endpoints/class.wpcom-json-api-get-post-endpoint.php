<?php
class WPCOM_JSON_API_Get_Post_Endpoint extends WPCOM_JSON_API_Post_Endpoint {
	// /sites/%s/posts/%d      -> $blog_id, $post_id
	// /sites/%s/posts/name:%s -> $blog_id, $post_id // not documented
	// /sites/%s/posts/slug:%s -> $blog_id, $post_id
	function callback( $path = '', $blog_id = 0, $post_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$args = $this->query_args();

		if ( false === strpos( $path, '/posts/slug:' ) && false === strpos( $path, '/posts/name:' ) ) {
			$get_by = 'ID';
		} else {
			$get_by = 'name';
		}

		$return = $this->get_post_by( $get_by, $post_id, $args['context'] );
		if ( !$return || is_wp_error( $return ) ) {
			return $return;
		}

		/** This action is documented in json-endpoints/class.wpcom-json-api-site-settings-endpoint.php */
		do_action( 'wpcom_json_api_objects', 'posts' );

		return $return;
	}
}
