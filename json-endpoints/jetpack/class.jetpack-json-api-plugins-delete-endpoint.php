<?php

class Jetpack_JSON_API_Plugins_Delete_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {

	// POST  /sites/%s/plugins/%s/delete
	protected $needed_capabilities = 'delete_plugins';
	protected $action              = 'delete';
	protected $download_links      = array();

	protected function delete() {

		if ( is_wp_error( $error = delete_plugins( $this->plugins ) ) ) {
			return $error;
		};

		return true;
	}

}
