<?php
class WPCOM_JSON_API_Render_Embed_Endpoint extends WPCOM_JSON_API_Endpoint {
	// /sites/%s/embeds/render -> $blog_id
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error( 'unauthorized', 'Your token must have permission to post on this blog.', 403 );
		}

		$args = $this->query_args();
		$embed_url = trim( $args['embed_url'] );

		// quick validation
		if ( ! preg_match_all( '|^\s*(https?://[^\s"]+)\s*$|im', $embed_url, $matches ) ) {
			return new WP_Error( 'invalid_embed_url',  'The embed_url parameter must be a valid URL.', 400 );
		}

		if ( count( $matches[1] ) > 1 ) {
			return new WP_Error( 'invalid_embed',  'Only one embed can be rendered at a time.', 400 );
		}

		$embed_url = array_shift( $matches[1] );
		$parts = parse_url( $embed_url );
		if ( ! $parts ) {
			return new WP_Error( 'invalid_embed_url', 'The embed_url parameter must be a valid URL.', 400 );
		}

		// in order for oEmbed to fire in the `$wp_embed->shortcode` method, we need to set a post as the current post
		$_posts = get_posts( array( 'posts_per_page' => 1, 'suppress_filters' => false ) );
		if ( ! empty( $_posts ) ) {
			global $post;
			$post = array_shift( $_posts );
		}

		global $wp_embed;
		$maybe_embed = $wp_embed->shortcode( array(), $embed_url );
		$is_an_embed = ( $embed_url != $maybe_embed && $wp_embed->maybe_make_link( $embed_url ) != $maybe_embed );
		if ( $is_an_embed ) {
			return array(
				'embed_url' => $embed_url,
				'result' => $maybe_embed,
			);
		} else {
			return new WP_Error( 'invalid_embed',  'The requested URL is not an embed.', 400 );
		}

	}
}