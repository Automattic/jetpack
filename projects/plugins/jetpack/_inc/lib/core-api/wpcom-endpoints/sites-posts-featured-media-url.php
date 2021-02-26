<?php

/*
 * Plugin Name: WPCOM Add Featured Media URL
 *
 * Adds `jetpack_featured_media_url` to post responses
 */

class WPCOM_REST_API_V2_Sites_Posts_Add_Featured_Media_URL {
	function __construct() {
		add_action( 'rest_api_init', array( $this, 'add_featured_media_url' ) );
	}

	function add_featured_media_url() {
		register_rest_field( 'post', 'jetpack_featured_media_url',
			array(
				'get_callback'    => array( $this, 'get_featured_media_url' ),
				'update_callback' => null,
				'schema'          => null,
			)
		);
	}

	function get_featured_media_url( $object, $field_name, $request ) {
		$featured_media_url = '';
		$image_attributes = wp_get_attachment_image_src(
			get_post_thumbnail_id( $object['id'] ),
			'full'
		);
		if ( is_array( $image_attributes ) && isset( $image_attributes[0] ) ) {
			$featured_media_url = (string) $image_attributes[0];
		}
		return $featured_media_url;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Sites_Posts_Add_Featured_Media_URL' );
