<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-blaze
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Include WooCommerce mocks before initializing test environment.
require_once __DIR__ . '/mocks/class-wc-product.php';
require_once __DIR__ . '/mocks/woocommerce-functions.php';

// Initialize WordPress test environment.
\Automattic\Jetpack\Test_Environment::init();
