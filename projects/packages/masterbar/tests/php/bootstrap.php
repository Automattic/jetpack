<?php
/**
 * Bootstrap.
 *
 * @package jetpack-masterbar
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

\WorDBless\Load::load();
