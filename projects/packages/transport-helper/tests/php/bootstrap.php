<?php
/**
 * Initialize the testing environment.
 *
 * @package automattic/jetpack-transport-helper
 */

/**
 * Load the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

\WorDBless\Load::load();
