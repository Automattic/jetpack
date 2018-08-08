<?php

require_once( 'rest-api-export.php' );
require_once( 'rest-api-reconnect.php' );

/**
 * Initialize REST API.
 *
 * This function will be called on `rest_api_init` action.
 */
function wpcomsh_rest_api_init() {
	wpcomsh_rest_api_export_init();
	wpcomsh_rest_api_reconnect_init();
}
