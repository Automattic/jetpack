<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-ip
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

/**
 * Shadow the DNS lookups, so tests can supply their own answers.
 */
require_once __DIR__ . '/class-jetpack-ip-test-resolver.php';
require_once __DIR__ . '/resolver-stubs.php';
