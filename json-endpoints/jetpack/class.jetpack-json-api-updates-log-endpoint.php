<?php

class Jetpack_JSON_API_Updates_Log_Endpoint extends Jetpack_JSON_API_Endpoint {
	// GET /sites/%s/updates/log
	protected $needed_capabilities = 'manage_options';


	protected function result() {
		return array( 'log' => Jetpack_Options::get_option( 'updates_log' ) );
	}

}
