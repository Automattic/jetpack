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
 *
 * @return bool
 */
function jetpack_docker_connection_ui_activator() {
	return true;
}

add_filter( 'jetpack_connection_ui_active', __NAMESPACE__ . '\jetpack_docker_connection_ui_activator' );
