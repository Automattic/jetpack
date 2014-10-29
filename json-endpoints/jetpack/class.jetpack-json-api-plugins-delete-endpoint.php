<?php

class Jetpack_JSON_API_Plugins_Delete_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {

	// POST  /sites/%s/plugins/%s/delete
	protected $needed_capabilities = 'delete_plugins';
	protected $action              = 'delete';

	protected function delete() {

		foreach( $this->plugins as $plugin ) {

			if ( Jetpack::is_plugin_active( $plugin ) ) {
				$error = $this->log[ $plugin ][] ='You cannot delete a plugin while it is active on the main site.';
				continue;
			}

			$result = delete_plugins ( array( $plugin ) );
			if ( is_wp_error( $result ) ) {
				$error = $this->log[ $plugin ][] = $result->get_error_message();
			} else {
				$this->log[ $plugin ][] = 'Plugin deleted';
			}
		}

		if( ! $this->bulk && isset( $error ) ) {
			return  new WP_Error( 'delete_plugin_error', $error, 400 );
		}

		return true;
	}

}
