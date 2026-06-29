<?php
/**
 * Bootstrap.
 *
 * @package automattic/
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Load Patchwork before WordPress so Brain Monkey can redefine WP core functions that the test
// suite mocks (e.g. `is_admin_bar_showing()`); otherwise they're defined too early to intercept.
require_once __DIR__ . '/../../vendor/antecedent/patchwork/Patchwork.php';

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();
