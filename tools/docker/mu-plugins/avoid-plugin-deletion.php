<?php
/**
 * Plugin Name: Disable deleting and updating Jetpack
 * Description: Disable deleting and updating -actions for Jetpack plugin. Being able to delete your local development directory from WordPress is catastrophic and you can lose your git history in the process.
 * Version: 2.0
 * Author: Automattic
 * Author URI: https://automattic.com/
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

use Jetpack\Docker\MuPlugin\Monorepo;

/**
 * Remove the Delete link from your plugins list for important plugins
 *
 * @param string[] $actions     An array of plugin action links. By default this can include 'activate',
 *                              'deactivate', and 'delete'. With Multisite active this can also include
 *                              'network_active' and 'network_only' items.
 * @param string   $plugin_file Path to the plugin file relative to the plugins directory.
 *                              'recently_activated', 'upgrade', 'mustuse', 'dropins', and 'search'.
 *
 * @return mixed
 */
function jetpack_docker_disable_plugin_deletion_link( $actions, $plugin_file ) {
	$jetpack_docker_avoided_plugins = ( new Monorepo() )->plugins();
	if (
		array_key_exists( 'delete', $actions ) &&
		in_array(
			$plugin_file,
			$jetpack_docker_avoided_plugins,
			true
		)
	) {
		unset( $actions['delete'] );
	}
	return $actions;
}
add_filter( 'plugin_action_links', 'jetpack_docker_disable_plugin_deletion_link', 10, 2 );

/**
 * Fail deletion attempts of our important plugins
 *
 * @param string $plugin_file Path to the plugin file relative to the plugins directory.
 */
function jetpack_docker_disable_delete_plugin( $plugin_file ) {
	$jetpack_docker_avoided_plugins = ( new Monorepo() )->plugins();
	if ( in_array( $plugin_file, $jetpack_docker_avoided_plugins, true ) ) {
		wp_die(
			esc_html( 'Deleting plugin "' . $plugin_file . '" is disabled at mu-plugins/avoid-plugin-deletion.php' ),
			403
		);
	}
}
add_action( 'delete_plugin', 'jetpack_docker_disable_delete_plugin', 10, 2 );

/**
 * Stop WordPress noticing plugin updates for important plugins.
 *
 * @param mixed $plugins Value of site transient.
 */
function jetpack_docker_disable_plugin_update( $plugins ) {
	$jetpack_docker_avoided_plugins = ( new Monorepo() )->plugins();
	if ( ! is_array( $jetpack_docker_avoided_plugins ) ) {
		return $plugins;
	}
	foreach ( $jetpack_docker_avoided_plugins as $avoided_plugin ) {
		if ( isset( $plugins->response[ $avoided_plugin ] ) ) {
			unset( $plugins->response[ $avoided_plugin ] );
		}
	}
	return $plugins;
}
add_filter( 'site_transient_update_plugins', 'jetpack_docker_disable_plugin_update' );
