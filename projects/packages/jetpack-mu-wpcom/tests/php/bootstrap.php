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

// Generate stub asset files for testing before loading the package
require_once __DIR__ . '/../../bin/generate-asset-files.php';

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();

require_once __DIR__ . '/../lib/functions-wordpress.php';
require_once __DIR__ . '/../lib/class-wpcom-features.php';
require_once __DIR__ . '/../../src/class-jetpack-mu-wpcom.php';
Automattic\Jetpack\Jetpack_Mu_Wpcom::init();
