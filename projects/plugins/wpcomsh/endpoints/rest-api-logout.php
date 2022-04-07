<?php
/**
 * Logout endpoint.
 *
 * @package endpoints
 */

/**
 * Logs the current user out.
 *
 * Useful for closing sessions remotely.
 *
 * @return WP_REST_Response
 */
function wpcomsh_rest_api_logout() {
	wp_destroy_all_sessions();
	return new WP_REST_Response(
		array(
			'success' => true,
		),
		200
	);
}

/**
 * Initialize API.
 */
function wpcomsh_rest_api_logout_init() {
	register_rest_route(
		'wpcomsh/v1',
		'/logout',
		array(
			array(
				'methods'             => 'POST',
				'permission_callback' => 'is_user_logged_in',
				'callback'            => 'wpcomsh_rest_api_logout',
			),
		)
	);
}
