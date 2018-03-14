<?php
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
		unset( $actions['delete']) ;
	}
	return $actions;
}
