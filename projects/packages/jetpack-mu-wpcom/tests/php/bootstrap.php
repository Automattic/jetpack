<?php
/**
 * Bootstrap.
 *
 * @package automattic/
 */

// Preloading the file to reconcile Brain\Monkey with Wordbless.
require_once __DIR__ . '/../../vendor/antecedent/patchwork/Patchwork.php';

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();

require_once __DIR__ . '/../lib/functions-wordpress.php';
require_once __DIR__ . '/../lib/class-wpcom-features.php';
require_once __DIR__ . '/../../src/class-jetpack-mu-wpcom.php';
Automattic\Jetpack\Jetpack_Mu_Wpcom::init();
