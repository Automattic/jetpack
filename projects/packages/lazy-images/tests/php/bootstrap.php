<?php
/**
 * PHPUnit bootstrap file.
 *
 * @package automattic/jetpack-lazy-images
 */

define( 'IS_JETPACK_LAZY_IMAGES_TESTS', true ); // flag for hack

/**
 * Load the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

/**
 * Load WorDBless
 */
\WorDBless\Load::load();
