<?php
/**
 * WordPress versions endpoint.
 *
 * Reports the WordPress versions WP Cloud's latest and beta tracks serve, which can lag
 * behind wordpress.org. Calypso shows them when a site switches between the two.
 *
 * @package endpoints
 */

/**
 * Returns the WordPress version each track serves, or null if the track isn't available.
 *
 * @return WP_REST_Response
 */
function wpcomsh_rest_api_wordpress_versions() {
	$versions = array();
	foreach ( array( 'latest', 'beta' ) as $track ) {
		$versions[ $track ] = wpcomsh_get_wordpress_track_version( $track );
	}

	return new WP_REST_Response( $versions, 200 );
}

/**
 * Reads the WordPress version a WP Cloud track serves.
 *
 * @param string $track The track, e.g. "beta".
 * @return string|null
 */
function wpcomsh_get_wordpress_track_version( $track ) {
	$version_file = "/wordpress/core/$track/wp-includes/version.php";
	if ( ! is_readable( $version_file ) ) {
		return null;
	}

	// The file sets $wp_version in this scope, like wp_get_wp_version() does.
	$wp_version = null;
	include $version_file;

	return $wp_version;
}

/**
 * Permission callback: only allow users who can manage the site.
 *
 * @return bool
 */
function wpcomsh_rest_api_wordpress_versions_permission() {
	return current_user_can( 'manage_options' );
}

/**
 * Initialize API.
 */
function wpcomsh_rest_api_wordpress_versions_init() {
	register_rest_route(
		'wpcomsh/v1',
		'/wordpress-versions',
		array(
			array(
				'methods'             => 'GET',
				'permission_callback' => 'wpcomsh_rest_api_wordpress_versions_permission',
				'callback'            => 'wpcomsh_rest_api_wordpress_versions',
			),
		)
	);
}
