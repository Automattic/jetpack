<?php

class WPCOM_JSON_API_Update_Site_Logo_Endpoint extends WPCOM_JSON_API_Endpoint {
	function callback( $path = '', $site_id = 0 ) {
		// Switch to the given blog.
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $site_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error( 'unauthorized', 'User is not authorized to access logo settings', 403 );
		}

		if ( strpos( $path, '/delete' ) ) {
			delete_option( 'site_logo' );
			return array();
		}

		$args = $this->input();
		$logo_settings = $this->get_current_settings();
		if ( empty( $args ) || ! is_array( $args ) ) {
			return $logo_settings;
		}

		if ( isset( $args['id'] ) ) {
			$logo_settings['id'] = intval( $args['id'], 10 );
		}
		if ( isset( $args['url'] ) ) {
			$logo_settings['url'] = $args['url'];
		}
		if ( isset( $args['url'] ) || isset( $args['id'] ) ) {
			update_option( 'site_logo', $logo_settings );
		}

		return $this->get_current_settings();
	}

	function get_current_settings() {
		$logo_settings = get_option( 'site_logo' );
		if ( ! is_array( $logo_settings ) ) {
			$logo_settings = array();
		}
		return $logo_settings;
	}
}

