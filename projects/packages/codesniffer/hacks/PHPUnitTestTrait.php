<?php
/**
 * Hack around insufficiencies in MediaWiki\Sniffs\PHPUnit\PHPUnitTestTrait
 *
 * @package automattic/jetpack-codesniffer
 */

// phpcs:disable -- Better to keep close to upstream than to follow WP conventions.

namespace MediaWiki\Sniffs\PHPUnit;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Util\Tokens;

/**
 * Check if a class is a test class
 *
 * @license GPL-2.0-or-later
 */
trait PHPUnitTestTrait {

	/**
	 * Set of PHPUnit base classes, without leading backslash
	 * @var string[]
	 */
	private static $PHPUNIT_CLASSES = [
		// @phan-suppress-previous-line PhanReadOnlyPrivateProperty Traits cannot have constants
		'MediaWikiTestCase' => 'MediaWikiTestCase',
		'MediaWikiUnitTestCase' => 'MediaWikiUnitTestCase',
		'MediaWikiIntegrationTestCase' => 'MediaWikiIntegrationTestCase',
		'PHPUnit_Framework_TestCase' => 'PHPUnit_Framework_TestCase',
		// This class may be 'use'd, but checking for that would be complicated
		'PHPUnit\\Framework\\TestCase' => 'PHPUnit\\Framework\\TestCase',
		// HACK: Add WordPress classes
		'WP_UnitTestCase' => 'WP_UnitTestCase',
		'WP_UnitTestCase_Base' => 'WP_UnitTestCase_Base',
	];

	/**
	 * @param File $phpcsFile
	 * @param int|false $stackPtr
	 *
	 * @return bool
	 */
	private function isTestFile( File $phpcsFile, $stackPtr = false ) {
		$classToken = $this->getClassToken( $phpcsFile, $stackPtr ) ?:
			$phpcsFile->findNext( Tokens::$ooScopeTokens, 0 );
		return $this->isTestClass( $phpcsFile, $classToken );
	}

	/**
	 * @param File $phpcsFile
	 * @param int|false $classToken Must point at a T_CLASS token
	 *
	 * @return bool
	 */
	private function isTestClass( File $phpcsFile, $classToken ) {
		$tokens = $phpcsFile->getTokens();
		if ( !$classToken || $tokens[$classToken]['code'] !== T_CLASS ) {
			return false;
		}

		$extendedClass = ltrim( $phpcsFile->findExtendedClassName( $classToken ), '\\' );
		return array_key_exists( $extendedClass, self::$PHPUNIT_CLASSES ) ||
			(bool)preg_match(
				'/(?:Test(?:Case)?(?:Base)?|Suite)$/',
				$phpcsFile->getDeclarationName( $classToken )
			) ||
			// HACK: Add logic to look for extending anything ending in "TestCase"
			(bool)preg_match( '/(?:Test(?:Case)?(?:Base)?|Suite)$/', $extendedClass );
	}

	/**
	 * @param File $phpcsFile
	 * @param int $functionToken Token position of the function declaration
	 * @return bool
	 */
	private function isTestFunction( File $phpcsFile, $functionToken ) {
		return $this->isTestClass( $phpcsFile, $this->getClassToken( $phpcsFile, $functionToken ) )
			&& preg_match( '/^(?:test|provide)|Provider$/', $phpcsFile->getDeclarationName( $functionToken ) );
	}

	/**
	 * @param File $phpcsFile
	 * @param int|false $stackPtr Should point at the T_CLASS token or a token in the class
	 *
	 * @return int|false
	 */
	private function getClassToken( File $phpcsFile, $stackPtr ) {
		if ( !$stackPtr ) {
			return false;
		}

		$tokens = $phpcsFile->getTokens();
		if ( $tokens[$stackPtr]['code'] === T_CLASS ) {
			return $stackPtr;
		}

		foreach ( $tokens[$stackPtr]['conditions'] as $ptr => $type ) {
			if ( $type === T_CLASS ) {
				return $ptr;
			}
		}

		return false;
	}

}
