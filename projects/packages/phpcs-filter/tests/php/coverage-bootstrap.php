<?php
/**
 * Bootstrap PHP-Parser's compatibility tokens before PHP_CodeSniffer is loaded.
 *
 * @package    automattic/jetpack-phpcs-filter
 * @subpackage Tests
 */

$compatibility_tokens = __DIR__ . '/../../vendor/nikic/php-parser/lib/PhpParser/compatibility_tokens.php';

if ( file_exists( $compatibility_tokens ) ) {
	// PHPCS emulates future tokens with string values, while PHP-Parser requires integer token IDs.
	// Load PHP-Parser's definitions first to prevent that conflict during coverage initialization.
	require_once $compatibility_tokens;
}
