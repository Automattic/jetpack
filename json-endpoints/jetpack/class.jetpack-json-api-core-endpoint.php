<?php

class Jetpack_JSON_API_Core_Endpoint extends Jetpack_JSON_API_Endpoint {

	// POST /sites/%s/core
	public function callback( $path = '', $blog_id = 0 ) {

		global $wp_version;

		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'update_core' ) ) ) {
			return $error;
		}

		$args = $this->input();

		if ( isset( $args['autoupdate'] ) && is_bool( $args['autoupdate'] ) ) {
			$this->set_autoupdate( $args['autoupdate'] );
		}

		$autoupdate = Jetpack_Options::get_option( 'autoupdate_core', false );

		return array(
			'version'    => $wp_version,
			'autoupdate' => $autoupdate,
		);
	}

	protected function set_autoupdate( $autoupdate ) {
		Jetpack_Options::update_option( 'autoupdate_core', $autoupdate );
	}

}
