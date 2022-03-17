<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-identity-crisis
 */

/**
 * Include the Composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

/**
 * Load WorDBless
 */
\WorDBless\Load::load();
require_once ABSPATH . WPINC . '/class-IXR.php';
