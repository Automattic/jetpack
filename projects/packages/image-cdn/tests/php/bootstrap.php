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

/**
 * Load WorDBless
 */
\WorDBless\Load::load();

/**
 * Load helper base class
 */
require_once __DIR__ . '/class-image-cdn-attachment-test-case.php';
