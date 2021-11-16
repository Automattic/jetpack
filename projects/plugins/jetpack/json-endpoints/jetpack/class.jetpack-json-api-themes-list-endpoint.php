<?php

class Jetpack_JSON_API_Themes_List_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {
	// GET /sites/%s/themes

	protected $needed_capabilities = 'switch_themes';

	public function validate_input( $theme ) {
		$this->themes = wp_get_themes( array( 'allowed' => true ) );
		return true;
	}

}
