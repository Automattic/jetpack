<?php
class WPCOM_JSON_API_Render_Embed_Reversal_Endpoint extends WPCOM_JSON_API_Render_Endpoint {
	// /sites/%s/embeds/reversal -> $blog_id
	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error( 'unauthorized', 'Your token must have permission to post on this blog.', 403 );
		}

		$is_shortcode = $is_embed = false;

		$input = $this->input( true );
		$maybe_embed = trim( $input['maybe_embed'] );
		if ( empty( $maybe_embed ) ) {
			return new WP_Error( 'empty_embed', 'Please provide an embed code to process.', 400 );
		}

		$ksesed_content = trim( wp_strip_all_tags( wp_kses_post( $maybe_embed ), true ) );
		if ( empty( $ksesed_content ) ) {
			return new WP_Error( 'invalid_embed', 'Invalid or empty embed provided.', 400 );
		}

		$shortcode_pattern = get_shortcode_regex();
		$url_pattern = '/^http(s)?:\/\/[a-z0-9-]+(.[a-z0-9-]+)*(:[0-9]+)?(\/.*)?$/i';
		preg_match_all( "/$shortcode_pattern/s", $ksesed_content, $shortcode_matches );
		preg_match_all( "$url_pattern", $ksesed_content, $url_matches );

		if ( empty( $shortcode_matches[0] ) && empty( $url_matches[0] ) )
			return new WP_Error( 'invalid_embed', 'The provided embed is not supported.', 400 );

		if ( ( count( $shortcode_matches[0] ) + count( $url_matches[0] ) ) > 1 ) {
			return new WP_Error( 'invalid_embed', 'Only one embed/shortcode reversal can be rendered at a time.', 400 );
		}

		if ( ! empty( $shortcode_matches[0] ) ) {
			$is_shortcode = true;
		} elseif ( ! empty( $url_matches[0] ) ) {
			$is_embed = true;
		}

		$render = $this->process_render( array( $this, 'render_shortcode_reversal' ), array( 'shortcode_reversal' => $ksesed_content, 'is_shortcode' => $is_shortcode, 'is_embed' => $is_embed ) );


		// if nothing happened, then the shortcode does not exist.
		global $wp_embed;
		if ( empty( $render ) || empty( $render['result'] ) || $ksesed_content == $render['result'] || $wp_embed->maybe_make_link( $maybe_embed ) == $render['result'] ) {
			return new WP_Error( 'invalid_embed',  'The provided embed is not supported.', 400 );
		}

		// our output for this endpoint..
		$return['maybe_embed'] = $maybe_embed;
		$return['result'] = $ksesed_content;
		$return['reversal_type'] = ( $is_embed ) ? 'embed' : 'shortcode';
		$return['render_result'] = $render['result'];

		$return = $this->add_assets( $return, $render['loaded_scripts'], $render['loaded_styles'] );

		return $return;
	}

	function render_shortcode_reversal( $args ) {
		if ( $args['is_shortcode'] ) {
			return call_user_func( array( $this, 'do_shortcode' ), $args['shortcode_reversal'] );
		} else if ( $args['is_embed'] ) {
			return call_user_func( array( $this, 'do_embed' ), $args['shortcode_reversal'] );
		}
		return false;
	}

}