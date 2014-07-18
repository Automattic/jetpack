<?php
class WPCOM_JSON_API_Render_Shortcode_Endpoint extends WPCOM_JSON_API_Render_Endpoint {
	// /sites/%s/shortcodes/render -> $blog_id
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error( 'unauthorized', 'Your token must have permission to post on this blog.', 403 );
		}

		$args = $this->query_args();
		$shortcode = trim( $args['shortcode'] );

		// Quick validation - shortcodes should always be enclosed in brackets []
		if ( ! wp_startswith( $shortcode, '[' ) || ! wp_endswith( $shortcode, ']' ) ) {
			return new WP_Error( 'invalid_shortcode',  'The shortcode parameter must begin and end with square brackets.', 400 );
		}

		// Make sure only one shortcode is being rendered at a time
		$pattern = get_shortcode_regex();
		preg_match_all( "/$pattern/s", $shortcode, $matches );
		if ( count( $matches[0] ) > 1 ) {
			return new WP_Error( 'invalid_shortcode',  'Only one shortcode can be rendered at a time.', 400 );
		}

		$render = $this->process_render( array( $this, 'do_shortcode' ), $shortcode );

		// if nothing happened, then the shortcode does not exist.
		if ( $shortcode == $render['result'] ) {
			return new WP_Error( 'invalid_shortcode',  'The requested shortcode does not exist.', 400 );
		}

		// our output for this endpoint..
		$return['shortcode'] = $shortcode;
		$return['result'] = $render['result'];

		$return = $this->add_assets( $return, $render['loaded_scripts'], $render['loaded_styles'] );

		return $return;
	}

	function do_shortcode( $shortcode ) {
		$result = do_shortcode( $shortcode );
		return $result;
	}

}