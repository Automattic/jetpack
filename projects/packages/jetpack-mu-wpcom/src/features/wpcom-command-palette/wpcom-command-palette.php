<?php
/**
 * WPCom Command Palette support for WordPress.com sites.
 *
 * @package automattic/jetpack-mu-plugins
 */

/**
 * Check if the WPCom Command Palette should be loaded.
 *
 * @return bool
 */
function should_load_wpcom_command_palette() {
	global $pagenow;
	$excluded_pages = array(
		'post.php',
		'post-new.php',
		'site-editor.php',
	);
	return isset( $pagenow ) && ! in_array( $pagenow, $excluded_pages, true );
}

/**
 * Load the WPCom Command Palette.
 */
function wpcom_load_command_palette() {
	if ( ! should_load_wpcom_command_palette() ) {
		return;
	}

	wp_enqueue_script(
		'command-palette-script',
		'//widgets.wp.com/command-palette/build.min.js',
		array(),
		'1.0.1',
		true
	);
	wp_enqueue_style(
		'command-palette-styles',
		'//widgets.wp.com/command-palette/build.css',
		array(),
		'1.0.1',
		true
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_load_command_palette' );

/**
 * Adds the WPCom Command Palette node.
 */
function wpcom_add_command_palette_node() {
	if ( ! should_load_wpcom_command_palette() ) {
		return;
	}

	echo '<div id="command-palette"></div>';
}
add_action( 'in_admin_header', 'wpcom_add_command_palette_node' );
