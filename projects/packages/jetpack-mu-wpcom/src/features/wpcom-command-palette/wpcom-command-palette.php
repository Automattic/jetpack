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

	$command_palette_js_handle = 'command-palette-script';
	$version                   = gmdate( 'Ymd' );
	$host                      = new Automattic\Jetpack\Status\Host();

	wp_enqueue_script(
		$command_palette_js_handle,
		'//widgets.wp.com/command-palette/build.min.js',
		array(),
		$version,
		true
	);
	wp_localize_script(
		$command_palette_js_handle,
		'commandPaletteConfig',
		array(
			'siteId'       => Jetpack_Options::get_option( 'id' ),
			'isAdmin'      => current_user_can( 'manage_options' ),
			'isAtomic'     => $host->is_woa_site(),
			'isSimple'     => $host->is_wpcom_simple(),
			'isSelfHosted' => ! $host->is_wpcom_platform(),
		)
	);
	wp_enqueue_style(
		'command-palette-styles',
		'//widgets.wp.com/command-palette/build.css',
		array(),
		$version,
		true
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_load_command_palette', 99999 );
