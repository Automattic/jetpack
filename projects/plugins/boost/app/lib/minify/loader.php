<?php
// Only intercept 404 requests.
if ( ! is_404() ) {
	return;
}

// Get the path for the current request.
$request_uri = remove_query_arg( 'JB_NONEXISTENTQUERY_ARG' );
if ( stripos( $request_uri, '/wp-content/boost-cache/static/' ) === false ) {
	return;
}

// Load minify library code.
require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/Utils.php';
require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/Config.php';
require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/Dependency_Path_Mapping.php';
require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/functions-helpers.php';
require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/functions-service.php';
require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/functions-service-new.php';

// Send a status 200 header, otherwise the browser will return a 404.
status_header( 200 );
jetpack_boost_handle_minify_request( $request_uri );
exit;
