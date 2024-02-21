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
 * Get the WPCom Command Palette JS configuration as a string.
 *
 * @return string
 */
function get_wpcom_command_palette_config_js() {
	$host         = new Automattic\Jetpack\Status\Host();
	$data         = array(
		'siteId'       => Jetpack_Options::get_option( 'id' ),
		'isAdmin'      => current_user_can( 'manage_options' ) ? 'true' : 'false',
		'isAtomic'     => $host->is_woa_site() ? 'true' : 'false',
		'isSimple'     => $host->is_wpcom_simple() ? 'true' : 'false',
		'isSelfHosted' => ! $host->is_wpcom_platform() ? 'true' : 'false',
	);
	$encoded_data = wp_json_encode( $data );

	return "var commandPaletteConfig = $encoded_data;";
}

/**
 * Load the WPCom Command Palette.
 */
function wpcom_load_command_palette() {
	if ( ! should_load_wpcom_command_palette() ) {
		return;
	}

	$command_palette_js_handle = 'command-palette-script';

	wp_enqueue_script(
		'command-palette-script',
		'//widgets.wp.com/command-palette/build.min.js',
		array(),
		'1.0.1',
		true
	);
	wp_add_inline_script(
		$command_palette_js_handle,
		get_wpcom_command_palette_config_js(),
		'before'
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
