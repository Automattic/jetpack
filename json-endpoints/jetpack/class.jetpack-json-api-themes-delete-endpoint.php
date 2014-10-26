<?php

class Jetpack_JSON_API_Themes_Delete_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {

	// POST  /sites/%s/plugins/%s/delete
	protected $needed_capabilities = 'delete_themes';
	protected $action              = 'delete';

	protected function delete() {

		foreach( $this->themes as $theme ) {
			if ( is_wp_error( $error = delete_theme( $theme ) ) ) {
				return $error;
			}
		}

		return true;
	}

}
