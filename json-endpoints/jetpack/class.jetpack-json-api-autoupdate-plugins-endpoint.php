<?php

class Jetpack_JSON_API_Autoupdate_Plugins_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {

	// POST /sites/%s/autoupdate/plugins

	public function callback( $path = '', $blog_id = 0 ) {
        parse_str( $this->api->post_body );
        return $this->api->post_body;
	}
}
