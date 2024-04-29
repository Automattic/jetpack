<?php
/**
 * Bootstrap.
 *
 * @package automattic/scheduled-updates
 */

/**
 * Include the composer autoloader and dependencies.
 */
require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../lib/functions-wordpress.php';

/**
 * Load WorDBless.
 */
\WorDBless\Load::load();
