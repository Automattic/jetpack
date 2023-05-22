<?php

// how do we know if called directly?
if ( ! defined( 'JETPACK_BOOST_CONCAT_USE_WP' ) ) {
	define( 'JETPACK_BOOST_CONCAT_USE_WP', false );
}
// define( 'ABSPATH', '../../../' );
// define( 'WP_CONTENT_DIR', '../../cache/page_optimize' );
// define( 'WP_CONTENT_URL', 'http://jetpack-boost.test/wp-content/' );
// define( 'WP_PLUGIN_URL', 'http://jetpack-boost.test/wp-content/plugins/boost/' );
// define( 'WP_PLUGIN_DIR', __DIR__ );

require_once __DIR__ . '/app/lib/minify/Utils.php';
require_once __DIR__ . '/app/lib/minify/Config.php';
require_once __DIR__ . '/app/lib/minify/Dependency_Path_Mapping.php';
require_once __DIR__ . '/app/lib/minify/functions-helpers.php';
require_once __DIR__ . '/app/lib/minify/functions-service.php';

jetpack_boost_page_optimize_service_request();

// Todo:
// - move cssmin outside vendor, or load directly from vendor
// replace all wp_filesystem calls with own
// replace all wp_ calls with own
