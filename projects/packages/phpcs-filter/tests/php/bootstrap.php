<?php
/**
 * PHPUnit bootstrap.
 *
 * @package automattic/jetpack-phpcs-filter
 */

// Include the Composer autoloader.
require_once __DIR__ . '/../../vendor/autoload.php';

// PHPCS 3.13.0 starts defining these PHP 8.4 constants, but defines them as strings. Meanwhile nikic/php-parser complains if they're not ints.
// But the problem only occurs with the combination of the require below and PHPUnit generating coverage.
// Anyway, we can preemptively define the constants before the require to avoid the problem.
// @todo Drop this once we run coverage with PHP 8.4, or when phpcs fixes it themself.
if ( ! defined( 'T_PUBLIC_SET' ) ) {
	define( 'T_PUBLIC_SET', 8675309 );
	define( 'T_PROTECTED_SET', 8675310 );
	define( 'T_PRIVATE_SET', 8675311 );
}

// Phpcs needs some bootstrapping of its own for tests to work.
require_once __DIR__ . '/../../vendor/squizlabs/php_codesniffer/tests/bootstrap.php';
