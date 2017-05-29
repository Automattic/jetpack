<?php

class WPCOM_JSON_API_Update_Site_Homepage_Endpoint extends WPCOM_JSON_API_Endpoint {

	function callback( $path = '', $site_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $site_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error( 'unauthorized', 'User is not authorized to access homepage settings', 403 );
		}

		$args = $this->input();
		if ( empty( $args ) || ! is_array( $args ) ) {
			return $this->get_current_settings();
		}

		if ( isset( $args['is_page_on_front'] ) ) {
			$show_on_front = $args['is_page_on_front'] ? 'page' : 'posts';
			update_option( 'show_on_front', $show_on_front );
		}
		if ( isset( $args['page_on_front_id'] ) ) {
			update_option( 'page_on_front', $args['page_on_front_id'] );
		}
		if ( isset( $args['page_for_posts_id'] ) ) {
			update_option( 'page_for_posts', $args['page_for_posts_id'] );
		}

		return $this->get_current_settings();
	}

	function get_current_settings() {
		$is_page_on_front = ( get_option( 'show_on_front' ) === 'page' );
		$page_on_front_id = get_option( 'page_on_front' );
		$page_for_posts_id = get_option( 'page_for_posts' );

		return array(
			'is_page_on_front' => $is_page_on_front,
			'page_on_front_id' => $page_on_front_id,
			'page_for_posts_id' => $page_for_posts_id,
		);
	}
}
