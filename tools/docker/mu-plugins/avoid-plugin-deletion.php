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

/**
 * Check if a plugin can be updated or deleted.
 *
 * Monorepo plugins are symlinked, so that's an easy way to detect our plugins (and
 * maybe a few more). Further, WP has issues deleting symlinked plugins anyway:
 * https://core.trac.wordpress.org/ticket/36710
 *
 * Additional plugins can be blocked via the 'jetpack_docker_avoided_plugins' filter.
 *
 * @param string        $plugin_file     Plugin file.
 * @param string[]|null $blocked_plugins Optional. Array of blocked plugin files.
 *                                       If null, will be populated via the
 *                                       'jetpack_docker_avoided_plugins' filter.
 *
 * @return bool True if the plugin can be updated/deleted, false otherwise.
 */
function jetpack_docker_can_update_delete_plugin( $plugin_file, $blocked_plugins = null ) {
	if ( ! $blocked_plugins ) {
		$blocked_plugins = apply_filters( 'jetpack_docker_avoided_plugins', array() );
	}
	$plugin_dir = WP_PLUGIN_DIR . '/' . dirname( $plugin_file );

	return (
		! is_link( $plugin_dir ) &&
		! in_array( $plugin_file, $blocked_plugins, true )
	);
}

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
	if (
		array_key_exists( 'delete', $actions ) && ! jetpack_docker_can_update_delete_plugin( $plugin_file )
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
	if ( ! jetpack_docker_can_update_delete_plugin( $plugin_file ) ) {
		wp_send_json_error(
			'Deleting plugin "' . $plugin_file . '" is disabled at mu-plugins/avoid-plugin-deletion.php',
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
	// No updates detected, so abort.
	if ( ! is_object( $plugins ) || $plugins->response ) {
		return $plugins;
	}

	// We apply the filter here so we don't have to run it for each plugin.
	$blocked_plugins = apply_filters( 'jetpack_docker_avoided_plugins', array() );

	foreach ( $plugins->response as $plugin_file => $plugin_data ) {
		if ( ! jetpack_docker_can_update_delete_plugin( $plugin_file, $blocked_plugins ) ) {
			unset( $plugins->response[ $plugin_file ] );
		}
	}
	return $plugins;
}
add_filter( 'site_transient_update_plugins', 'jetpack_docker_disable_plugin_update' );
