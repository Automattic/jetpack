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
 * Returns the active Gutenberg version and where it comes from.
 *
 * When the Gutenberg plugin is active, `version` is its release number and `source`
 * is `plugin`. Otherwise the block editor is served by WordPress core's bundle, which
 * carries no discrete Gutenberg version constant; in that case `version` is null,
 * `source` is `core`, and `wp_version` is returned so tooling can map the core release
 * to its bundled editor.
 *
 * @return WP_REST_Response
 */
function wpcomsh_rest_api_gutenberg_version() {
	global $wp_version;

	$version = defined( 'GUTENBERG_VERSION' ) ? GUTENBERG_VERSION : null;

	return new WP_REST_Response(
		array(
			'version'    => $version,
			'source'     => null === $version ? 'core' : 'plugin',
			'wp_version' => is_string( $wp_version ) ? $wp_version : null,
		),
		200
	);
}

/**
 * Permission callback: only allow sites where the `wpcomsh_expose_gutenberg_version` option is enabled.
 *
 * @return bool
 */
function wpcomsh_rest_api_gutenberg_version_permission() {
	return (bool) get_option( 'wpcomsh_expose_gutenberg_version', false );
}

/**
 * Add no-cache headers to responses for this endpoint so the WoA edge cache
 * doesn't serve stale 200/401 responses after the option is toggled.
 *
 * @param WP_REST_Response $response The REST response.
 * @param WP_REST_Server   $server   The REST server instance.
 * @param WP_REST_Request  $request  The REST request.
 * @return WP_REST_Response
 */
function wpcomsh_rest_api_gutenberg_version_nocache( $response, $server, $request ) {
	if ( $request instanceof WP_REST_Request && '/wpcomsh/v1/gutenberg-version' === $request->get_route() ) {
		$response->header( 'Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0' );
	}
	return $response;
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

	add_filter( 'rest_post_dispatch', 'wpcomsh_rest_api_gutenberg_version_nocache', 10, 3 );
}
