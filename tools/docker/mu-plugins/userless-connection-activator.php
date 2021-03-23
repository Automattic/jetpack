<?php
/**
 * Plugin Name: Userless Connection Activator
 * Description: Activates the Jetpack Userless Connection functionality.
 * Version: 1.0
 * Author: Automattic
 * Author URI: https://automattic.com/
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

namespace Jetpack\Docker\MuPlugin\UserlessConnectionActivator;

/**
 * Activate the Jetpack Userless Connection.
 */
function jetpack_docker_userless_connection_activator() {
	if ( ! defined( 'JETPACK_NO_USER_TEST_MODE' ) ) {
		define( 'JETPACK_NO_USER_TEST_MODE', true );
	}
}

add_filter( 'plugins_loaded', __NAMESPACE__ . '\jetpack_docker_userless_connection_activator' );
