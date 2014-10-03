<?php

class Jetpack_JSON_API_Autoupdate_Plugins_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {

	// POST /sites/%s/autoupdate/plugins

	public function callback( $path = '', $blog_id = 0, $plugin = null ) {
        if ( is_wp_error( $error = $this->validate_call( $blog_id, 'update_plugins' ) ) ) {
            return $error;
        }
        if ( is_wp_error( $error = $this->validate_input( $plugin ) ) ) {
            return $error;
        }
        if ( is_wp_error( $error = $this->validate_plugins() ) ) {
            return new WP_Error( 'unknown_plugin', $error->get_error_messages() , 404 );
        }
        return 'hello world';
	}
}
