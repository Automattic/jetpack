<?php
/**
 * Gutenberg version endpoint.
 *
 * Exposes the active Gutenberg plugin version for designated sites, used by
 * team tooling (gbstatus) to report Gutenberg versions across environments
 * without requiring per-site authentication.
 *
 * @package endpoints
 */

/**
 * Returns the active Gutenberg plugin version, or null if the plugin is not active.
 *
 * @return WP_REST_Response
 */
function wpcomsh_rest_api_gutenberg_version() {
	$version = defined( 'GUTENBERG_VERSION' ) ? GUTENBERG_VERSION : null;

	return new WP_REST_Response(
		array(
			'version' => $version,
		),
		200
	);
}

/**
 * Permission callback: only allow sites carrying the `gutenberg-version-endpoint` sticker.
 *
 * @return bool
 */
function wpcomsh_rest_api_gutenberg_version_permission() {
	return wpcomsh_is_site_sticker_active( 'gutenberg-version-endpoint' );
}

/**
 * Initialize API.
 */
function wpcomsh_rest_api_gutenberg_version_init() {
	register_rest_route(
		'wpcomsh/v1',
		'/gutenberg-version',
		array(
			array(
				'methods'             => 'GET',
				'permission_callback' => 'wpcomsh_rest_api_gutenberg_version_permission',
				'callback'            => 'wpcomsh_rest_api_gutenberg_version',
			),
		)
	);
}
