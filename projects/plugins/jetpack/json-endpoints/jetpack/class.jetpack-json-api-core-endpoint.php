<?php

class Jetpack_JSON_API_Core_Endpoint extends Jetpack_JSON_API_Endpoint {
	// POST /sites/%s/core
	// POST /sites/%s/core/update
	protected $needed_capabilities = 'manage_options';
	protected $new_version;
	protected $log;

	public function result() {
		global $wp_version;

		return array(
			'version'    => ( empty( $this->new_version ) ) ? $wp_version : $this->new_version,
			'autoupdate' => Jetpack_Options::get_option( 'autoupdate_core', false ),
			'log'        => $this->log,
		);
	}

}
