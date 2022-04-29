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
require_once __DIR__ . '/../../jetpack-social.php';
