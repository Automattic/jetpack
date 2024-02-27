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
	$site_id    = Jetpack_Options::get_option( 'id' );
	$is_p2_site = str_contains( get_stylesheet(), 'pub/p2' ) || function_exists( '\WPForTeams\is_wpforteams_site' ) && is_wpforteams_site( $site_id );
	$data       = wp_json_encode(
		array(
			'siteId'       => $site_id,
			'isAdmin'      => current_user_can( 'manage_options' ),
			'isAtomic'     => $host->is_woa_site(),
			'isSimple'     => $host->is_wpcom_simple(),
			'isSelfHosted' => ! $host->is_wpcom_platform(),
			'capabilities' => get_userdata( get_current_user_id() )->allcaps,
			'isP2'         => $is_p2_site,
		)
	);
	wp_add_inline_script(
		$command_palette_js_handle,
		"var commandPaletteConfig = $data;",
		'before'
	);
	wp_enqueue_style(
		'command-palette-styles',
		'//widgets.wp.com/command-palette/build.css',
		array(),
		$version
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_load_command_palette', 99999 );
