<?php

/**
 * Load minify library code.
 *
 * @since 4.0.0
 *
 * @return void
 */
function jetpack_boost_minify_load_library(): void {
	require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/class-utils.php';
	require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/class-config.php';
	require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/class-dependency-path-mapping.php';
	require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/functions-helpers.php';
	require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/functions-service-fallback.php';
	require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/functions-service.php';
}
jetpack_boost_minify_load_library();

add_action(
	'template_redirect',
	function () {
		// Only intercept 404 requests.
		if ( ! is_404() ) {
			return;
		}

		// Get the path for the current request.
		$request_uri = remove_query_arg( 'JB_NONEXISTENTQUERY_ARG' );
		if ( ! str_contains( strtolower( $request_uri ), '/wp-content/boost-cache/static/' ) ) {
			return;
		}

		jetpack_boost_check_404_handler( $request_uri );

		// Send a status 200 header, otherwise the browser will return a 404.
		status_header( 200 );
		jetpack_boost_handle_minify_request( $request_uri );
		exit( 0 );
	}
);
