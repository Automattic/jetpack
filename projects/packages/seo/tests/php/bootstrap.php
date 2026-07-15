<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-seo
 */

require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

\Automattic\Jetpack\Test_Environment::init();

// Controllable stand-ins for the host-plugin classes the SEO package guards on
// with class_exists(). The real implementations live in projects/plugins/jetpack
// and are not autoloaded in the package test context, so these let the tests
// drive Schema_Builder's behavior. Tests set their public static properties.
require_once __DIR__ . '/stubs/class-jetpack-seo-utils.php';
require_once __DIR__ . '/stubs/class-jetpack-seo-posts.php';
require_once __DIR__ . '/stubs/class-jetpack-options.php';
require_once __DIR__ . '/stubs/class-woocommerce.php';
