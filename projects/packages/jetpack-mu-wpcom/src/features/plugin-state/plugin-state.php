<?php
/**
 * Plugin State feature.
 *
 * Exposes one plugin's state to WordPress.com over a blog-token-signed REST route. Atomic only.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Plugin_State\WP_REST_Plugin_State_Controller;

require_once __DIR__ . '/class-wp-rest-plugin-state-controller.php';

add_action(
	'rest_api_init',
	function () {
		( new WP_REST_Plugin_State_Controller() )->register_routes();
	}
);
