<?php

class Jetpack_JSON_API_Themes_Modify_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {

	protected $autoupdate;

	public function callback( $path = '', $blog_id = 0, $theme = null ) {

		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'update_themes' ) ) ) {
			return $error;
		}

		if ( is_wp_error( $error = $this->validate_input( $theme ) ) ) {
			return $error;
		}

		if ( is_wp_error( $error = $this->validate_themes() ) ) {
			return new WP_Error( 'unknown_theme', $error->get_error_messages() , 404 );
		}

		if( is_wp_error( $error = $this->validate_autoupdate() ) ) {
			return $error;
		}

		if( true === $this->autoupdate ) {
			$result = $this->flag_autoupdates();
		} else {
			$result = $this->unflag_autoupdates();
		}

		if ( 1 === count( $this->themes ) ) {
			$theme        = $result[0];
			return $theme;
		}

		return $result;
	}

	function validate_autoupdate() {

	}

	function flag_autoupdates() {

	}

	function unflag_autoupdates() {

	}

}