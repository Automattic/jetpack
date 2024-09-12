<?php
/**
 * Custom REST API endpoints for wpcomsh.
 *
 * @package endpoints
 */

// Require endpoint files.
require_once __DIR__ . '/class-marketplace-webhook-response.php';
require_once __DIR__ . '/class-backup-import-response.php';
require_once __DIR__ . '/class-rest-api-code-deployment-logs-controller.php';
require_once __DIR__ . '/rest-api-export.php';
require_once __DIR__ . '/rest-api-logout.php';
require_once __DIR__ . '/rest-api-reconnect.php';

/**
 * Initialize REST API.
 */
function wpcomsh_rest_api_init() {
	$controller = new Marketplace_Webhook_Response();
	$controller->register_routes();

	$controller = new Backup_Import_Response();
	$controller->register_routes();

	// Code deployment logs endpoints
	$controller = new Rest_Api_Code_Deployment_Logs_Controller();
	$controller->register_routes();

	wpcomsh_rest_api_export_init();
	wpcomsh_rest_api_logout_init();
	wpcomsh_rest_api_reconnect_init();
}
add_action( 'rest_api_init', 'wpcomsh_rest_api_init' );
