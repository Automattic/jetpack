<?php

class Jetpack_JSON_API_Plugins_List_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {

	// GET /sites/%s/plugins
	public function callback( $path = '', $_blog_id = 0 ) {
		if ( is_wp_error( $error = $this->validate_call( $_blog_id, 'activate_plugins', false ) ) ) {
			return $error;
		}

		$installed_plugins = get_plugins();

		$response = array();

		$response[ 'found' ] = count( $installed_plugins );

		foreach ( $installed_plugins as $plugin_file => $plugin_data ) {
			$response['plugins'][] = $this->format_plugin( $plugin_file, $plugin_data );
		}

		return $response;
	}
}
