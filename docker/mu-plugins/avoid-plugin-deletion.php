<?php

/*
Plugin Name: Disable deleting and updating Jetpack
Description: Disable deleting and updating -actions for Jetpack plugin. Being able to delete your local development directory from WordPress is catastrophic and you can lose your git history in the process.
Version: 2.0
Author: Automattic
Author URI: http://automattic.com/
*/

// These are the plugins we don't want to update or delete
$jetpack_docker_avoided_plugins = array(
	'jetpack/jetpack.php',
);

/**
 * Remove the Delete link from your plugins list for important plugins
 */
function jetpack_docker_disable_plugin_deletion_link( $actions, $plugin_file, $plugin_data, $context ) {
	global $jetpack_docker_avoided_plugins;
	if (
		array_key_exists( 'delete', $actions ) &&
		in_array(
			$plugin_file,
			$jetpack_docker_avoided_plugins
		)
	) {
		unset( $actions['delete'] );
	}
	return $actions;
}
add_filter( 'plugin_action_links', 'jetpack_docker_disable_plugin_deletion_link', 10, 4 );

/**
 * Fail deletion attempts of our important plugins
 */
function jetpack_docker_disable_delete_plugin( $plugin_file ) {
	global $jetpack_docker_avoided_plugins;
	if ( in_array( $plugin_file, $jetpack_docker_avoided_plugins ) ) {
		wp_die(
			'Deleting plugin "' . $plugin_file . '" is disabled at mu-plugins/avoid-plugin-deletion.php',
			403
		);
	}
}
add_action( 'delete_plugin', 'jetpack_docker_disable_delete_plugin', 10, 2 );

/**
 * Stop WordPress noticing plugin updates for important plugins
 */
function jetpack_docker_disable_plugin_update( $plugins ) {
	global $jetpack_docker_avoided_plugins;
	foreach( $jetpack_docker_avoided_plugins as $avoided_plugin ) {
		if ( isset( $plugins->response[ $avoided_plugin ] ) ) {
			unset( $plugins->response[ $avoided_plugin ] );
		}
	}
	return $plugins;
}
add_filter( 'site_transient_update_plugins', 'jetpack_docker_disable_plugin_update' );
