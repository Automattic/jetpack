<?php
class WPCOM_JSON_API_List_Embeds_Endpoint extends WPCOM_JSON_API_Endpoint {
	// /sites/%s/embeds -> $blog_id
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
		$output = array( 'embeds' => array() );
	
		if ( ! function_exists( '_wp_oembed_get_object' ) ) {
			require_once( ABSPATH . WPINC . '/class-oembed.php' );
		}
				
		global $wp_embed;
		$oembed = _wp_oembed_get_object();

		foreach( $wp_embed->handlers as $priority => $handlers ) {
			foreach( $handlers as $handler ) {
				if ( ! empty( $handler['regex'] ) )
					$output['embeds'][] = $handler['regex'];
			}
		}

		foreach ( $oembed->providers as $regex => $oembed_info ) {
			if ( ! empty( $regex ) )
				$output['embeds'][] = $regex;
		}

		return $output;
	}
}
