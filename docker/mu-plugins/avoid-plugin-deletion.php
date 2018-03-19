<?php

/*
Plugin Name: Remove delete link for Jetpack
Description: Removes the Delete link from your plugins list for the current Jetpack directory
Version: 1.0
Author: Automattic
Author URI: http://automattic.com/
*/

/**
 * avoid-plugin-deletion.php
 *
 * This file contains a hook that removes the Delete link from your plugins list for the current Jetpack directory.
 *
 * It was added because the effect of being able to delete your local development directory from WordPress is catastrophic and you can lose
 * your git history in the process.
 */
add_filter( 'plugin_action_links', 'disable_plugin_deletion', 10, 4 );

function disable_plugin_deletion( $actions, $plugin_file, $plugin_data, $context ) {

	// Remove delete link for important plugins
	if (
		array_key_exists( 'delete', $actions ) &&
		in_array(
			$plugin_file,
			array(
				'jetpack/jetpack.php',
			)
		)
	) {
		unset( $actions['delete'] );
	}
	return $actions;
}
