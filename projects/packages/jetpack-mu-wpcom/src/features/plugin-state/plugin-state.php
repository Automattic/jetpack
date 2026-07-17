<?php
/**
 * Plugin State feature.
 *
 * Exposes one plugin's state to WordPress.com over a blog-token-signed REST route. Atomic only.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Plugin_State\Plugin_State_REST_Controller;

require_once __DIR__ . '/class-plugin-state-rest-controller.php';

add_action(
	'rest_api_init',
	function () {
		( new Plugin_State_REST_Controller() )->register_routes();
	}
);
