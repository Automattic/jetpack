<?php
/**
 * Stand-in for the route helper wp-build generates for each package.
 *
 * @package automattic/jetpack-admin-ui
 */

/**
 * Hand each route to the registrar, as the generated helper does.
 *
 * @param array  $page_routes            Routes with `path`, and optionally `content` and `route` module IDs.
 * @param string $register_function_name Registrar function name.
 * @return void
 */
function jetpack_shell_test_register_page_routes( $page_routes, $register_function_name ) {
	foreach ( $page_routes as $route ) {
		if ( function_exists( $register_function_name ) ) {
			call_user_func( $register_function_name, $route['path'], $route['content'] ?? null, $route['route'] ?? null );
		}
	}
}
