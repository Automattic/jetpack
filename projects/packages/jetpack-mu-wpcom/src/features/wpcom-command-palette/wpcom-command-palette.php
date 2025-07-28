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
	// Only load on the WPcom platform.
	if ( ! class_exists( 'Automattic\Jetpack\Status\Host' ) ) {
		return false;
	}

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
	$jetpack_status            = new Automattic\Jetpack\Status();

	wp_enqueue_script(
		$command_palette_js_handle,
		'//widgets.wp.com/command-palette/build.min.js',
		array(
			'react',
			'react-dom',
			'wp-components',
			'wp-compose',
			'wp-dom-ready',
			'wp-element',
			'wp-i18n',
			'wp-polyfill',
			'wp-primitives',
			'wp-url',
		),
		$version,
		array(
			'strategy'  => 'defer',
			'in_footer' => true,
		)
	);
	$site_id    = Jetpack_Options::get_option( 'id' );
	$is_p2_site = str_contains( get_stylesheet(), 'pub/p2' ) || function_exists( '\WPForTeams\is_wpforteams_site' ) && is_wpforteams_site( $site_id );
	$data       = wp_json_encode(
		array(
			'siteId'           => $site_id,
			'isAtomic'         => $host->is_woa_site(),
			'isSimple'         => $host->is_wpcom_simple(),
			'isSelfHosted'     => ! $host->is_wpcom_platform(),
			'isStaging'        => (bool) get_option( 'wpcom_is_staging_site' ),
			'isPrivate'        => $jetpack_status->is_private_site(),
			'isComingSoon'     => $jetpack_status->is_coming_soon(),
			'capabilities'     => get_userdata( get_current_user_id() )->allcaps,
			'isP2'             => $is_p2_site,
			'shouldUseWpAdmin' => 'wp-admin' === get_option( 'wpcom_admin_interface' ),
			'siteHostname'     => wpcom_get_site_slug(),
			'siteName'         => get_option( 'blogname' ),
			'isWpcomStore'     => $host->is_woa_site() && is_plugin_active( 'woocommerce/woocommerce.php' ),
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
		array( 'wp-components' ),
		$version
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_load_command_palette', 99999 );
