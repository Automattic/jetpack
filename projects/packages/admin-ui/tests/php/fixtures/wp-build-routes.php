<?php
/**
 * Stand-in for the route and page helpers wp-build generates for the test guest, `guest-page`.
 *
 * @package automattic/jetpack-admin-ui
 */

/**
 * Do what loading the generated build does: reset the page's routes and hook their registration on its init action.
 *
 * @return void
 */
function jetpack_shell_test_load_build() {
	$GLOBALS['jetpack_shell_test_guest_page_wp_admin_routes'] = array();
	add_action( 'guest-page-wp-admin_init', 'jetpack_shell_test_register_guest_page_wp_admin_page_routes' );
}

/**
 * Register the routes in the routes data global.
 *
 * @return void
 */
function jetpack_shell_test_register_guest_page_wp_admin_page_routes() {
	foreach ( $GLOBALS['jetpack_shell_test_guest_page_routes_data'] ?? array() as $route ) {
		jetpack_shell_test_register_guest_page_wp_admin_route( $route['path'], $route['content'] ?? null, $route['route'] ?? null );
	}
}

/**
 * Register one route for the page.
 *
 * @param string      $path           Route path.
 * @param string|null $content_module Content script module ID.
 * @param string|null $route_module   Route script module ID.
 * @return void
 */
function jetpack_shell_test_register_guest_page_wp_admin_route( $path, $content_module = null, $route_module = null ) {
	$route = array( 'path' => $path );
	if ( ! empty( $content_module ) ) {
		$route['content_module'] = $content_module;
	}
	if ( ! empty( $route_module ) ) {
		$route['route_module'] = $route_module;
	}
	$GLOBALS['jetpack_shell_test_guest_page_wp_admin_routes'][] = $route;
}

/**
 * The page's registered routes.
 *
 * @return array[]
 */
function jetpack_shell_test_get_guest_page_wp_admin_routes() {
	return $GLOBALS['jetpack_shell_test_guest_page_wp_admin_routes'] ?? array();
}
