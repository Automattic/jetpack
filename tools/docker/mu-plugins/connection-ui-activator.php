<?php
/**
 * Plugin Name: Connection UI Activator
 * Description: Activates the Jetpack Connection UI functionality.
 * Version: 1.0
 * Author: Automattic
 * Author URI: https://automattic.com/
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

namespace Jetpack\Docker\MuPlugin\ConnectionUIActivator;

/**
 * Activate the Jetpack Connection UI.
 */
function jetpack_docker_connection_ui_activator() {
	if ( class_exists( '\Automattic\Jetpack\ConnectionUI\Admin' ) ) {
		\Automattic\Jetpack\ConnectionUI\Admin::init();
	}
}

add_action( 'plugins_loaded', __NAMESPACE__ . '\jetpack_docker_connection_ui_activator' );
