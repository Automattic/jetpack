<?php
/**
 * Site Switcher for Command Palette
 * Enqueues the site switcher UI and loads the compact sites list endpoint
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Load the Jetpack endpoint (not needed on WordPress.com simple sites)
if ( ! ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ) {
	require_once __DIR__ . '/site-switcher-endpoint.php';
}

/**
 * Enqueue site switcher scripts in all wp-admin pages.
 */
function jetpack_site_switcher_enqueue_scripts() {
	// Load asset file for dependencies and version
	$asset_file = JETPACK__PLUGIN_DIR . '_inc/build/site-switcher.min.asset.php';
	$asset      = file_exists( $asset_file ) ? require $asset_file : array(
		'dependencies' => array( 'wp-api-fetch', 'wp-commands', 'wp-element', 'wp-i18n' ),
		'version'      => JETPACK__VERSION,
	);

	// Register and enqueue site switcher JavaScript
	wp_enqueue_script(
		'jetpack-site-switcher',
		plugins_url( '_inc/build/site-switcher.min.js', JETPACK__PLUGIN_FILE ),
		$asset['dependencies'],
		$asset['version'],
		true
	);

	// Pass configuration to JavaScript
	$api_path = ( defined( 'IS_WPCOM' ) && IS_WPCOM )
		? '/rest/v1.1/me/sites/compact'
		: '/jetpack/v4/sites/compact';

	wp_add_inline_script(
		'jetpack-site-switcher',
		sprintf(
			'window.jetpackSiteSwitcherConfig = %s;',
			wp_json_encode(
				array(
					'userId'  => get_current_user_id(),
					'apiPath' => $api_path,
				),
				JSON_HEX_TAG | JSON_UNESCAPED_SLASHES
			)
		),
		'before'
	);
}

add_action( 'admin_enqueue_scripts', 'jetpack_site_switcher_enqueue_scripts' );
