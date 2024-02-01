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

\WorDBless\Load::load();

require_once __DIR__ . '/../lib/functions-wordpress.php';
require_once __DIR__ . '/../../src/class-jetpack-mu-wpcom.php';
Automattic\Jetpack\Jetpack_Mu_Wpcom::init();
