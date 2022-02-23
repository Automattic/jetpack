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

define( 'WP_DEBUG', true );
define( 'JETPACK_ENABLE_MY_JETPACK', true );

\WorDBless\Load::load();
