<?php
/**
 * Bootstrap for tests.
 *
 * @package Automattic/jetpack-post-list
 */

/**
 * Composer's autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();
