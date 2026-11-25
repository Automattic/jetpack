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

// Older SQLite libraries do not provide MySQL's byte-length function.
if ( isset( $GLOBALS['@pdo'] ) ) {
	$seo_test_pdo = $GLOBALS['@pdo'];
	// phpcs:ignore WordPress.DB.RestrictedClasses.mysql__PDO -- Inspect the existing SQLite test connection.
	if ( version_compare( $seo_test_pdo->getAttribute( PDO::ATTR_SERVER_VERSION ), '3.43.0', '<' ) ) {
		$seo_test_register = method_exists( $seo_test_pdo, 'createFunction' ) ? 'createFunction' : 'sqliteCreateFunction';
		$seo_test_pdo->$seo_test_register(
			'OCTET_LENGTH',
			static function ( $value ) {
				return null === $value ? null : strlen( (string) $value );
			},
			1
		);
	}
}

// A real database starts without the default roles, so every capability check fails.
// Seed them, so tests that act as an administrator have the capabilities of one.
if ( ! function_exists( 'populate_roles' ) ) {
	require_once ABSPATH . 'wp-admin/includes/schema.php';
}
populate_roles();

/**
 * Turn on the SEO switch the Jetpack plugin ships, as on a site whose owner never turned it off.
 *
 * Runs after tests' own module filters; a test that needs SEO off removes it.
 *
 * @param array $modules Active module slugs.
 * @return array
 */
function jetpack_seo_test_switch_on( $modules ) {
	return array_merge( (array) $modules, array( 'seo-dashboard' ) );
}
add_filter( 'jetpack_active_modules', 'jetpack_seo_test_switch_on', 1000 );

// Shared base for test cases that touch site content or the coverage cache.
// Not autoloaded: the package maps only src/, and the file doesn't match the
// suite's *Test.php suffix.
require_once __DIR__ . '/SeoTestCase.php';

// Controllable stand-ins for the host-plugin and platform code the SEO package
// guards on. Tests set their public static properties.
require_once __DIR__ . '/stubs/class-jetpack-redux-state-helper.php';
require_once __DIR__ . '/stubs/class-jetpack-ai-settings.php';
require_once __DIR__ . '/stubs/class-jetpack-options.php';
require_once __DIR__ . '/stubs/class-wc-structured-data.php';
require_once __DIR__ . '/stubs/class-woocommerce.php';
require_once __DIR__ . '/stubs/woocommerce-functions.php';
require_once __DIR__ . '/stubs/class-wpcom-test-features.php';
require_once __DIR__ . '/stubs/class-wpcom-store-api.php';
require_once __DIR__ . '/stubs/wpcom-feature-functions.php';
require_once __DIR__ . '/stubs/class-wpcom-test-user.php';
require_once __DIR__ . '/stubs/wpcom-user-functions.php';
