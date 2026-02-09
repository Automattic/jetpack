<?php
/**
 * Trait to provide functions to test if a class is a test class.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Codesniffer\Utils;

use PHP_CodeSniffer\Files\File;

/**
 * Trait adding functions to check if a class is a test class, or a file has a test class.
 */
trait IsTestClassTrait {

	/**
	 * Static cache for test file determination.
	 *
	 * @var array
	 */
	private static $testFileCache = array();

	/**
	 * Test if a file is a PHPUnit test file.
	 *
	 * @param File      $phpcsFile PHPCS File object.
	 * @param int|false $stackPtr PHPCS stack token pointer to a T_CLASS or to something with a T_CLASS condition.
	 *   If not given, the first T_CLASS token in the file will be checked.
	 * @return bool
	 */
	private function isTestFile( File $phpcsFile, $stackPtr = false ): bool {
		$filename = $phpcsFile->getFilename();

		// Check cache first
		if ( isset( self::$testFileCache[ $filename ] ) ) {
			return self::$testFileCache[ $filename ];
		}

		$classToken = false;

		// If $stackPtr points to a T_CLASS token, use it
		if ( $stackPtr !== false ) {
			$tokens = $phpcsFile->getTokens();
			if ( isset( $tokens[ $stackPtr ] ) && $tokens[ $stackPtr ]['code'] === T_CLASS ) {
				$classToken = $stackPtr;
			} else {
				// If $stackPtr has a T_CLASS condition, use that pointer
				$classToken = $phpcsFile->getCondition( $stackPtr, T_CLASS );
			}
		}

		// If no class token found, find the first T_CLASS token in the file
		if ( $classToken === false ) {
			$classToken = $phpcsFile->findNext( T_CLASS, 0 );
		}

		// Determine result
		$result = $classToken !== false && $this->isTestClass( $phpcsFile, $classToken );

		// Cache the result
		self::$testFileCache[ $filename ] = $result;

		return $result;
	}

	/**
	 * Test if a T_CLASS token is a PHPUnit test class.
	 *
	 * @param File      $phpcsFile PHPCS File object.
	 * @param int|false $classToken PHPCS stack token pointer. Should point at a T_CLASS token.
	 * @return bool
	 */
	private function isTestClass( File $phpcsFile, $classToken ): bool {
		$tokens = $phpcsFile->getTokens();

		// Verify the token is a T_CLASS
		if ( ! isset( $tokens[ $classToken ] ) || $tokens[ $classToken ]['code'] !== T_CLASS ) {
			return false;
		}

		// Get the class name
		$className = $phpcsFile->getDeclarationName( $classToken );
		if ( ! $className ) { // How?
			return false; // @codeCoverageIgnore
		}

		// Check if class name matches test class suffixes
		if ( preg_match( '/Test$|TestCase$|TestBase$|TestCaseBase$|Suite$/', $className ) ) {
			return true;
		}

		// Get the parent class name
		$parentClass = $phpcsFile->findExtendedClassName( $classToken );
		if ( ! empty( $parentClass ) ) {
			// Remove leading backslash from namespaced class names
			$parentClass = ltrim( $parentClass, '\\' );

			// Check if parent class name matches test class suffixes (with lowercase variants of Case and Base)
			if ( preg_match( '/Test$|Test[Cc]ase([Bb]ase)?$|Test[Bb]ase$|Suite$/', $parentClass ) ) {
				return true;
			}

			// Check for WP_UnitTestCase_Base
			if ( $parentClass === 'WP_UnitTestCase_Base' ) {
				return true;
			}

			// Check for WP_Test_*_Case, WP_Test_*_Base, or WP_Test_*_Suite patterns
			if ( preg_match( '/^WP_Test_.*_(Case|Base|Suite)$/i', $parentClass ) ) {
				return true;
			}
		}

		return false;
	}
}
