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

// Controllable stand-ins for the host-plugin and platform code the SEO package
// guards on. Tests set their public static properties.
require_once __DIR__ . '/stubs/class-jetpack-seo-utils.php';
require_once __DIR__ . '/stubs/class-jetpack-redux-state-helper.php';
require_once __DIR__ . '/stubs/class-jetpack-ai-settings.php';
require_once __DIR__ . '/stubs/class-jetpack-ai-sidebar.php';
require_once __DIR__ . '/stubs/class-jetpack-seo-posts.php';
require_once __DIR__ . '/stubs/class-jetpack-options.php';
require_once __DIR__ . '/stubs/class-wc-structured-data.php';
require_once __DIR__ . '/stubs/class-woocommerce.php';
require_once __DIR__ . '/stubs/woocommerce-functions.php';
require_once __DIR__ . '/stubs/class-wpcom-test-features.php';
require_once __DIR__ . '/stubs/class-wpcom-store-api.php';
require_once __DIR__ . '/stubs/wpcom-feature-functions.php';
require_once __DIR__ . '/stubs/class-wpcom-test-user.php';
require_once __DIR__ . '/stubs/wpcom-user-functions.php';
require_once __DIR__ . '/stubs/class-wpcom-test-async-jobs.php';
require_once __DIR__ . '/stubs/wpcom-async-job-functions.php';
