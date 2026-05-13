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

// Load the minimal WP_Error shim used by Brain Monkey-based tests.
require_once __DIR__ . '/class-wp-error.php';
