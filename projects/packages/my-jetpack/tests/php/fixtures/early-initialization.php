<?php
/**
 * WordPress plugin-file loading before its pluggable user functions exist.
 *
 * @package automattic/my-jetpack
 */

require __DIR__ . '/../../../vendor/autoload.php';
$includes = dirname( \Automattic\Jetpack\Test_Environment::find_autoloader(), 2 ) . '/wordpress/wp-includes/';
require $includes . 'plugin.php';
require $includes . 'load.php';
require $includes . 'formatting.php';
require $includes . 'capabilities.php';

define( 'JETPACK_DEV_DEBUG', true );
add_filter(
	'jetpack_my_jetpack_offline_features',
	static function () {
		return true;
	}
);
\Automattic\Jetpack\My_Jetpack\Initializer::init();

echo json_encode(
	array(
		'user_functions_loaded' => function_exists( 'wp_get_current_user' ),
		'initialized'           => did_action( 'my_jetpack_init' ),
		'rest_registered'       => false !== has_action( 'rest_api_init', array( \Automattic\Jetpack\My_Jetpack\Initializer::class, 'register_rest_endpoints' ) ),
	),
	JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
);
