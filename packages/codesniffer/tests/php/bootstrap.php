<?php
/**
 * Bootstrap file for the codesniffer test suite.
 *
 * @package automattic/jetpack-codesniffer
 */

if ( version_compare( PHP_VERSION, '7.2.0', '<' ) ) {
	echo 'PHP version is too old to run tests. 7.2 is required, but ' . PHP_VERSION . " is installed.\n";
	exit( 1 );
}

// Include the Composer autoloader.
require_once __DIR__ . '/../../vendor/autoload.php';

// Phpcs needs some bootstrapping of its own for tests to work.
require_once __DIR__ . '/../../vendor/squizlabs/php_codesniffer/tests/bootstrap.php';

// Register all the phpcs installed standards.
$installed_standards = PHP_CodeSniffer\Util\Standards::getInstalledStandardDetails();
foreach ( $installed_standards as $name => $details ) {
	PHP_CodeSniffer\Autoload::addSearchPath( $details['path'], $details['namespace'] );
}
