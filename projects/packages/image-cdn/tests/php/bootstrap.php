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

// Use WordBless if available, otherwise fallback to regular test environment.
// This handles an issue where too many concurrent tests are running and causes issues.
if ( class_exists( '\\WorDBless\\Load' ) ) {
	\WorDBless\Load::load();
} else {
	// Initialize WordPress test environment
	\Automattic\Jetpack\Test_Environment::init();
}

/**
 * Load helper base class
 */
require_once __DIR__ . '/class-image-cdn-attachment-test-case.php';
