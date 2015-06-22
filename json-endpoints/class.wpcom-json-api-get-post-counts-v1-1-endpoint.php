<?php

class WPCOM_JSON_API_GET_Post_Counts_V1_1_Endpoint extends WPCOM_JSON_API_Endpoint {
	public function callback( $path = '', $blog_id = 0, $post_type = 'post' ) {
		if ( ! get_current_user_id() ) {
			return new WP_Error( 'authorization_required', __( 'An active access token must be used to retrieve post counts.', 'jetpack' ), 403 );
		}

		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ), false );

		if ( is_wp_error( $blog_id ) ) {
			// invalid token/user access
			return $blog_id;
		}

		if ( ! post_type_exists( $post_type ) ) {
			return new WP_Error( 'unknown_post_type', __( 'Unknown post type requested.', 'jetpack' ), 404 );
		}

		$wp_post_counts = (array) wp_count_posts( $post_type );
		$whitelist = array( 'publish' );
		$counts = array();

		if ( current_user_can( 'edit_posts' ) ) {
			array_push( $whitelist, 'draft', 'future', 'pending', 'private', 'trash' );
		}

		foreach ( $wp_post_counts as $post_type => $type_count ) {
			if ( in_array( $post_type, $whitelist ) ) {
				$counts[ $post_type ] = (int) $type_count;
			}
		};

		$return = array(
			'statuses' => (array) $counts
		);

		return $return;
	}
}
