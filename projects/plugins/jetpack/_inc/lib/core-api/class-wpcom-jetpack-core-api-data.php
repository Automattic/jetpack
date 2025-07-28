<?php
require_once JETPACK__PLUGIN_DIR . '_inc/lib/core-api/class.jetpack-core-api-xmlrpc-consumer-endpoint.php';

require_once __DIR__ . '/class.jetpack-core-api-module-endpoints.php';

class Jetpack_WPCOM_Core_API_Data extends Jetpack_Core_API_Data {
	/**
	 * Override namespace
	 */
	public static $namespace = 'wpcom-origin/jetpack/v4';

	/**
	 * This endpoint *does not* need to connect directly to Jetpack sites.
	 */
	public $wpcom_is_wpcom_only_endpoint    = true;

	/**
	 * The member is required, otherwise the endpoint would be changed to site specific format.
	 */
	public $wpcom_is_site_specific_endpoint = false;
}
