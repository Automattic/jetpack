<?php
/**
 * Loads Random Redirect after another component has declared its global function.
 *
 * @package automattic/jetpack
 */

$registered_actions = array();

/**
 * Minimal WordPress action stub used to observe hook registration.
 *
 * @param string   $hook_name Hook name.
 * @param callable $callback  Hook callback.
 * @return true
 */
function add_action( $hook_name, $callback ) {
	global $registered_actions;
	$registered_actions[] = array( $hook_name, $callback );
	return true;
}

/**
 * Simulates the legacy implementation loaded by a theme or plugin before Jetpack.
 *
 * @return string Fixture marker.
 */
function jetpack_matt_random_redirect() {
	return 'existing implementation';
}

add_action( 'template_redirect', 'jetpack_matt_random_redirect' );

$plugin_dir = dirname( __DIR__, 3 );
require $plugin_dir . '/modules/theme-tools/random-redirect.php';
require $plugin_dir . '/modules/theme-tools/random-redirect.php';

if ( 'existing implementation' !== jetpack_matt_random_redirect() ) {
	throw new RuntimeException( 'Jetpack did not preserve the existing Random Redirect implementation.' );
}

$expected_actions = array(
	array( 'template_redirect', 'jetpack_matt_random_redirect' ),
);
if ( $expected_actions !== $registered_actions ) {
	throw new RuntimeException( 'Jetpack unexpectedly changed the existing Random Redirect hook.' );
}

echo "OK\n";
