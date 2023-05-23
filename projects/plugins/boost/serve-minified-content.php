<?php

if ( ! defined( 'JETPACK_BOOST_CONCAT_USE_WP' ) ) {
	define( 'JETPACK_BOOST_CONCAT_USE_WP', false );

	// Load CSSmin.
	require_once __DIR__ . '/vendor/tubalmartin/cssmin/src/Colors.php';
	require_once __DIR__ . '/vendor/tubalmartin/cssmin/src/Utils.php';
	require_once __DIR__ . '/vendor/tubalmartin/cssmin/src/Minifier.php';
}

// Load minify library code.
require_once __DIR__ . '/app/lib/minify/Utils.php';
require_once __DIR__ . '/app/lib/minify/Config.php';
require_once __DIR__ . '/app/lib/minify/Dependency_Path_Mapping.php';
require_once __DIR__ . '/app/lib/minify/functions-helpers.php';
require_once __DIR__ . '/app/lib/minify/functions-service.php';

jetpack_boost_page_optimize_service_request();
