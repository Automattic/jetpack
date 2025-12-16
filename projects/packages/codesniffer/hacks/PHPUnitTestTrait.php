<?php
/**
 * Replace MediaWiki\Sniffs\PHPUnit\PHPUnitTestTrait with something that will detect
 * WordPress's test class names, as MediaWiki's version is insufficiently flexible.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace MediaWiki\Sniffs\PHPUnit;

/**
 * Trait adding functions to check if a class is a test class, or a file has a test class.
 */
trait PHPUnitTestTrait {
	use \Automattic\Jetpack\Codesniffer\Utils\IsTestClassTrait;
}
