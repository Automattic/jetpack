<?php

class Jetpack_JSON_API_Plugins_List_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {
	// GET /sites/%s/plugins

	protected $needed_capabilities = 'activate_plugins';

	public function validate_input( $plugin ) {
		wp_update_plugins();
		$this->plugins = array_keys( get_plugins() );
		return true;
	}

}

