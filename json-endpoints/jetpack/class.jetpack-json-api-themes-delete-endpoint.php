<?php

class Jetpack_JSON_API_Themes_Delete_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {

	// POST  /sites/%s/plugins/%s/delete
	protected $needed_capabilities = 'delete_themes';
	protected $action              = 'delete';

	protected function delete() {

		foreach( $this->themes as $theme ) {
			$result = delete_theme( $theme );
			if ( is_wp_error( $result ) ) {
				$error = $this->log[ $theme ]['error'] = $result->get_error_messages;
			} else {
				$this->log[ $theme ][] = 'Theme deleted';
			}
		}

		if( ! $this->bulk && isset( $error ) ) {
			return  new WP_Error( 'delete_theme_error', $error, 400 );
		}

		return true;
	}

}
