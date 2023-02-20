<?php
/**
 * Custom REST API endpoints for wpcomsh.
 *
 * @package endpoints
 */

// Require endpoint files.
require_once 'class-marketplace-webhook-response.php';
require_once 'class-github-hosting-webhook-response.php';
require_once 'rest-api-export.php';
require_once 'rest-api-logout.php';
require_once 'rest-api-reconnect.php';


/**
 * Initialize REST API.
 */
function wpcomsh_rest_api_init() {
	$controller = new Marketplace_Webhook_Response();
	$controller->register_routes();

	$controller = new GitHub_Hosting_Webhook_Response();
	$controller->register_routes();

	wpcomsh_rest_api_export_init();
	wpcomsh_rest_api_logout_init();
	wpcomsh_rest_api_reconnect_init();
}
add_action( 'rest_api_init', 'wpcomsh_rest_api_init' );
