<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-premium-analytics
 */

require_once __DIR__ . '/../../vendor/autoload.php';

// PHPUnit pipes process-isolated child scripts through stdin, so a child starts with an
// empty SCRIPT_FILENAME. wp_guess_url() derives a needle from it and hands the empty result
// to strpos(), which warns on PHP 7.x and errors every isolated test before it runs. Give it
// what the parent process has: a real path outside ABSPATH.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __FILE__;
}

\Automattic\Jetpack\Test_Environment::init();

// Minimal WooCommerce stubs so the CSV export classes (which extend/depend on WC) can load
// and be exercised. Loaded after Test_Environment::init() so WordPress base classes
// (e.g. WP_REST_Controller) are already available for the stubs to extend.
require_once __DIR__ . '/mocks/woocommerce-mocks.php';

// Controllable stand-in for the WPCOM platform's feature gate, so the Simple/Atomic
// branch of is_videopress_available() can be driven in both directions. Inert until a
// test populates $GLOBALS['jpa_test_wpcom_features'].
require_once __DIR__ . '/mocks/wpcom-feature-mocks.php';

// Point the widget manifest at the fixture stub for the whole suite, so no test ever
// loads build/widgets.php. On a checkout that has been built, a test that declares the
// stub's jpa_get_registered_widget_modules() and then reaches
// ensure_widget_registry_ready() fatals on redeclare — require_once dedupes by path, not
// by symbol — taking the entire run with it. Filtering here rather than per test because
// ensure_widget_registry_ready() memoizes on a static, so only the first caller in the
// process ever performs the require, and which test that is depends on run order.
//
// Priority 1, so a test staging its own manifest always wins structurally rather than by
// insertion order. Named rather than a closure so the test that asserts the *unfiltered*
// default can lift it.
/**
 * The fixture stub standing in for the generated widget manifest.
 *
 * @return string Absolute path to the fixture.
 */
function jpa_test_widget_manifest_path() {
	return __DIR__ . '/fixtures/widget-modules-manifest.php';
}
add_filter( 'jetpack_premium_analytics_widgets_manifest_path', 'jpa_test_widget_manifest_path', 1 );
