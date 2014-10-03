<?php

class Jetpack_JSON_API_Autoupdate_Endpoint extends Jetpack_JSON_API_Themes_Endpoint {

	// POST /sites/%s/autoupdate

	protected $plugins = array();

	public function callback( $path = '', $blog_id = 0, $theme = null ) {
        return 'Hello World';
	}
}
