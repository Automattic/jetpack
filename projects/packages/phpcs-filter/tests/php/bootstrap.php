<?php
/**
 * PHPUnit bootstrap.
 *
 * @package automattic/jetpack-phpcs-filter
 */

// Include the Composer autoloader.
require_once __DIR__ . '/../../vendor/autoload.php';

// Phpcs needs some bootstrapping of its own for tests to work.
require_once __DIR__ . '/../../vendor/squizlabs/php_codesniffer/tests/bootstrap.php';
