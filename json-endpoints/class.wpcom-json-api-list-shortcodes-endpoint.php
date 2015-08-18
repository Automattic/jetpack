<?php
class WPCOM_JSON_API_List_Shortcodes_Endpoint extends WPCOM_JSON_API_Endpoint {
	// /sites/%s/shortcodes -> $blog_id
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		// permissions check
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error( 'unauthorized', 'Your token must have permission to post on this blog.', 403 );
		}

		// list em
		global $shortcode_tags;
		$output = array( 'shortcodes' => array() );

		foreach ( $shortcode_tags as $tag => $class ) {
			if ( '__return_false' == $class )
				continue;
			$output['shortcodes'][] = $tag;
		}

		return $output;
	}
}
