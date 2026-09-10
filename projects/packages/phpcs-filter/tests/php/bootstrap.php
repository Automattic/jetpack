<?php
/**
 * PHPUnit bootstrap.
 *
 * @package automattic/jetpack-phpcs-filter
 */

// Include the Composer autoloader.
require_once __DIR__ . '/../../vendor/autoload.php';

// PHPCS defines new PHP token constants as strings, while nikic/php-parser
// (used by PHPUnit's coverage code) complains if they're not ints.
// Load nikic/php-parser's compatibility file to define them as ints before loading PHPCS's test bootstrap.
if ( file_exists( __DIR__ . '/../../vendor/nikic/php-parser/lib/PhpParser/compatibility_tokens.php' ) ) {
	require_once __DIR__ . '/../../vendor/nikic/php-parser/lib/PhpParser/compatibility_tokens.php';
}

// Phpcs needs some bootstrapping of its own for tests to work.
require_once __DIR__ . '/../../vendor/squizlabs/php_codesniffer/tests/bootstrap.php';
