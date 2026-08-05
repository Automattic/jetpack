<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-seo
 */

require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

// SQLite rather than the default dbless engine: the Overview's content-coverage counts
// are a single SQL aggregate over wp_posts/wp_postmeta, and dbless has no database for it
// to run against — every count would be zero no matter what the query said.
\Automattic\Jetpack\Test_Environment::init( null, 'sqlite' );

// A real database starts without the default roles, so every capability check fails.
// Seed them, so tests that act as an administrator have the capabilities of one.
if ( ! function_exists( 'populate_roles' ) ) {
	require_once ABSPATH . 'wp-admin/includes/schema.php';
}
populate_roles();

// Shared base for test cases that touch site content or the coverage cache.
// Not autoloaded: the package maps only src/, and the file doesn't match the
// suite's *Test.php suffix.
require_once __DIR__ . '/SeoTestCase.php';

// Controllable stand-ins for the host-plugin classes the SEO package guards on
// with class_exists(). The real implementations live in projects/plugins/jetpack
// and are not autoloaded in the package test context, so these let the tests
// drive Schema_Builder's behavior. Tests set their public static properties.
require_once __DIR__ . '/stubs/class-jetpack-seo-utils.php';
require_once __DIR__ . '/stubs/class-jetpack-redux-state-helper.php';
require_once __DIR__ . '/stubs/class-jetpack-seo-posts.php';
require_once __DIR__ . '/stubs/class-jetpack-options.php';
require_once __DIR__ . '/stubs/class-wc-structured-data.php';
require_once __DIR__ . '/stubs/class-woocommerce.php';
require_once __DIR__ . '/stubs/woocommerce-functions.php';
require_once __DIR__ . '/stubs/class-wpcom-test-features.php';
require_once __DIR__ . '/stubs/wpcom-feature-functions.php';
