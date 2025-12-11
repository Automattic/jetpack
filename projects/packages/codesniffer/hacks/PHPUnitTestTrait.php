<?php
/**
 * Replace MediaWiki\Sniffs\PHPUnit\PHPUnitTestTrait with something that will detect
 * WordPress's test class names, as MediaWiki's version is insufficiently flexible.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace MediaWiki\Sniffs\PHPUnit;

use PHP_CodeSniffer\Files\File;

/**
 * Trait adding functions to check if a class is a test class, or a file has a test class.
 */
trait PHPUnitTestTrait {

	/**
	 * Test if a file is a PHPUnit test file.
	 *
	 * @param File $phpcsFile PHPCS File object.
	 * @param int|false $stackPtr PHPCS stack token pointer.
	 * @return bool
	 */
	private function isTestFile( File $phpcsFile, $stackPtr = false ): bool {
		/* If `$stackPtr` points to a T_CLASS token, use it.
		 * Otherwise, if `$stackPtr` has a T_CLASS condition, use that pointer. PHP_CodeSniffer\Files\File has a utility method suited for this.
		 * Otherwise, find the index of the first T_CLASS token in the file.
		 *
		 * Call `$this->isTestClass()` to determine the result.
		 *
		 * Cache the result in a static property by `$phpcsFile->getFilename()`.
		 */
	}

	/**
	 * Test if a T_CLASS token is a PHPUnit test class.
	 *
	 * @param File $phpcsFile PHPCS File object.
	 * @param int|false $stackPtr PHPCS stack token pointer. Should point at a T_CLASS token.
	 * @return bool
	 */
	private function isTestClass( File $phpcsFile, $classToken ): bool {
		/* If the token pointed to by `$classToken` is not a T_CLASS, return false.
		 *
		 * Get the name of the class, and the name of the class it extends (if any).
		 * PHP_CodeSniffer\Files\File has methods that are useful for this task.
		 *
		 * Return true if the class's name ends in `Test`, `TestCase`, `TestBase`, `TestCaseBase`, or `Suite`.
		 * Return true if the extended class's name ends in `Test`, `TestCase`, `TestBase`, `TestCaseBase`, or `Suite`. The `Case` and/or `Base` may be lowercase here.
		 * Return true if the extended class's name is `WP_UnitTestCase_Base`.
		 * Return true if the extended class is named like `WP_Test_*_Case`, `WP_Test_*_Base`, or `WP_Test_*_Suite`.
		 * Return false otherwise.
		 */
	}

}
