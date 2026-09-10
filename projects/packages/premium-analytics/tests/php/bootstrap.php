<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-premium-analytics
 */

require_once __DIR__ . '/../../vendor/autoload.php';

// PHPUnit's process-isolated children start with an empty SCRIPT_FILENAME (piped via stdin),
// which wp_guess_url() feeds to strpos() and errors on PHP 7.x — give it a real path outside ABSPATH.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __FILE__;
}

\Automattic\Jetpack\Test_Environment::init();

// Minimal WooCommerce stubs so the CSV export classes (which extend/depend on WC) can load and
// be exercised; loaded after Test_Environment::init() so WP_REST_Controller etc. already exist to extend.
require_once __DIR__ . '/mocks/woocommerce-mocks.php';

// Controllable stand-in for the WPCOM platform's feature gate, so the Simple/Atomic branch of
// is_videopress_available() can be driven either way; inert until a test populates $GLOBALS['jpa_test_wpcom_features'].
require_once __DIR__ . '/mocks/wpcom-feature-mocks.php';
