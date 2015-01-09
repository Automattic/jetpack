<?php

class Jetpack_JSON_API_Get_Protect_Whitelist extends Jetpack_JSON_API_Endpoint {
	protected $needed_capabilities = 'activate_plugins';

	public function callback( $path = '', $blog_id = 0, $object = null ) {
		if ( is_wp_error( $error = $this->validate_call( $blog_id, $this->needed_capabilities ) ) ) {
			return $error;
		}
		return $this->result();
	}

	public function result() {
		$whitelist = array(
			'whitelist' => get_site_option( 'jetpack_protect_whitelist', false ),
		);
		return $whitelist;
	}
}
