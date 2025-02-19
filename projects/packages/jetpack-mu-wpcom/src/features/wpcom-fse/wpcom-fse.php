<?php
/**
 * This is a feature to remove FSE plugin since it has been sunset for a while.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Remove FSE plugin from the active_plugins list if the file doesn't exist.
 *
 * @param array<string> $plugins The list of the active plugins.
 * @return array<string> The filtered active plugins.
 */
function remove_fse_plugin( $plugins ) {
	if ( ! is_array( $plugins ) ) {
		return $plugins;
	}

	$fse_plugin      = 'full-site-editing/full-site-editing-plugin.php';
	$fse_plugin_path = WP_PLUGIN_DIR . '/' . $fse_plugin;

	// Do nothing since the plugin file exists.
	if ( file_exists( $fse_plugin_path ) && is_file( $fse_plugin_path ) ) {
		return $plugins;
	}

	// Remove the plugin from the list of active plugins as the file doesn't exist.
	$fse_plugin_key = array_search( $fse_plugin, $plugins, true );
	if ( $fse_plugin_key !== false ) {
		unset( $plugins[ $fse_plugin_key ] );
	}

	return $plugins;
}
add_filter( 'option_active_plugins', 'remove_fse_plugin' );
