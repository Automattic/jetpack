<?php

/*
 * Plugin Name: WPCOM Media VideoPress
 *
 * Adds `jetpack_videopress` to media responses
 */

class WPCOM_REST_API_V2_Sites_Media_VideoPress {
	function __construct() {
		add_action( 'rest_api_init', array( $this, 'add_videopress_data' ) );
	}
	function add_videopress_data() {
		register_rest_field( 'attachment', 'jetpack_videopress',
			array(
				'get_callback'    => array( $this, 'get_videopress_data' ),
				'update_callback' => null,
				'schema'          => null,
			)
		);
	}
	function get_videopress_data( $object, $field_name, $request ) {
		$videopress_data = null;
		$blog_id = get_current_blog_id();
		$post_id = absint( $object['id'] );
		$videopress_id = video_get_info_by_blogpostid( $blog_id, $post_id )->guid;
		if ( $videopress_id ) {
			$videopress_data = videopress_get_video_details( $videopress_id );
		}
		return $videopress_data;
	}
}
wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Sites_Media_VideoPress' );