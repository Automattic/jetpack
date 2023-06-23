<?php
/**
 * Plugin Name: Force WPCOM disconnect in Offline Mode
 * Description: Connection package will skip disconnect on WPCOM in Offline Mode. Due to Monorepo's `DOCKER_REQUEST_URL` trick, we need this plugin to properly detect offline mode in CLI.
 * Version: 1.0
 * Author: Automattic
 * Author URI: https://automattic.com/
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

/**
 * Force WPCOM disconnect in CLI, because CLI is always in Offline Mode in Monorepo.
 *
 * @param bool $force The decision made earlier in the filter stack.
 *
 * @return bool
 */
function jetpack_docker_offline_mode_force_wpcom_disconnect( $force ) {
	return $force || ( defined( 'WP_CLI' ) && WP_CLI && defined( 'DOCKER_REQUEST_URL' ) );
}

add_filter( 'jetpack_connection_disconnect_site_wpcom_offline_mode', 'jetpack_docker_offline_mode_force_wpcom_disconnect' );
