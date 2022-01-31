<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-licensing
 */

define( 'JETPACK_MASTER_USER', true );

/**
 * Include composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

\WorDBless\Load::load();

// IXR legacy autoloading runs too early conditionally on ABSPATH and WPINC which are defined only after WordDBless loads.
require_once ABSPATH . WPINC . '/IXR/class-IXR-client.php';
require_once ABSPATH . WPINC . '/IXR/class-IXR-clientmulticall.php';
