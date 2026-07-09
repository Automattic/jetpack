<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-premium-analytics
 */

require_once __DIR__ . '/../../vendor/autoload.php';

\Automattic\Jetpack\Test_Environment::init();

// Minimal WooCommerce stubs so the CSV export classes (which extend/depend on WC) can load
// and be exercised. Loaded after Test_Environment::init() so WordPress base classes
// (e.g. WP_REST_Controller) are already available for the stubs to extend.
require_once __DIR__ . '/mocks/woocommerce-mocks.php';
