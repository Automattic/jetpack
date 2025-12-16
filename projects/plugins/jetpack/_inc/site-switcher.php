<?php
/**
 * Site Switcher for Command Palette
 * Provides a compact sites list endpoint and enqueues the site switcher UI
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Register REST API endpoint to fetch compact sites list from WordPress.com
 */
function jetpack_site_switcher_register_rest_routes() {
	register_rest_route(
		'jetpack/v4',
		'/sites/compact',
		array(
			'methods'             => 'GET',
			'callback'            => 'jetpack_site_switcher_get_sites',
			'permission_callback' => 'is_user_logged_in',
		)
	);
}
add_action( 'rest_api_init', 'jetpack_site_switcher_register_rest_routes' );

/**
 * Fetch compact sites list from WordPress.com API
 *
 * @return WP_REST_Response|WP_Error
 */
function jetpack_site_switcher_get_sites() {
	$response = Client::wpcom_json_api_request_as_user(
		'/me/sites/compact',
		'v1.1',
		array( 'method' => 'GET' ),
		null,
		'rest'
	);

	if ( is_wp_error( $response ) ) {
		return new WP_Error(
			'jetpack_site_switcher_error',
			__( 'Failed to fetch sites from WordPress.com', 'jetpack' ),
			array( 'status' => 500 )
		);
	}

	$response_code = wp_remote_retrieve_response_code( $response );
	if ( 200 !== $response_code ) {
		return new WP_Error(
			'jetpack_site_switcher_error',
			__( 'Failed to fetch sites from WordPress.com', 'jetpack' ),
			array( 'status' => $response_code )
		);
	}

	$body = json_decode( wp_remote_retrieve_body( $response ), true );

	if ( ! isset( $body['sites'] ) ) {
		return new WP_Error(
			'jetpack_site_switcher_invalid_response',
			__( 'Invalid response from WordPress.com API', 'jetpack' ),
			array( 'status' => 500 )
		);
	}

	return rest_ensure_response( $body );
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

	// Pass user ID for cache namespacing
	wp_add_inline_script(
		'jetpack-site-switcher',
		sprintf(
			'window.jetpackSiteSwitcherConfig = %s;',
			wp_json_encode( array( 'userId' => get_current_user_id() ), JSON_HEX_TAG | JSON_UNESCAPED_SLASHES )
		),
		'before'
	);
}

add_action( 'admin_enqueue_scripts', 'jetpack_site_switcher_enqueue_scripts' );
