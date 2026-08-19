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
