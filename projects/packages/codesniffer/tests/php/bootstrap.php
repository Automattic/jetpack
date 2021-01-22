<?php
/**
 * Bootstrap file for the codesniffer test suite.
 *
 * @package automattic/jetpack-codesniffer
 */

// Include the Composer autoloader.
require_once __DIR__ . '/../../vendor/autoload.php';

// Phpcs needs some bootstrapping of its own for tests to work.
require_once __DIR__ . '/../../vendor/squizlabs/php_codesniffer/tests/bootstrap.php';

// Register all the phpcs installed standards.
$installed_standards = PHP_CodeSniffer\Util\Standards::getInstalledStandardDetails();
foreach ( $installed_standards as $details ) {
	PHP_CodeSniffer\Autoload::addSearchPath( $details['path'], $details['namespace'] );
}
