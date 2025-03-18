<?php
/**
 * Sniff for PHPUnit's class name requirements.
 *
 * Eventually WPCS will add something like this, but we want it now.
 *
 * @see https://github.com/WordPress/WordPress-Coding-Standards/issues/2484
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;

/**
 * Sniff for PHPUnit's class name requirements.
 */
class TestClassNameSniff implements Sniff {
	use \MediaWiki\Sniffs\PHPUnit\PHPUnitTestTrait;

	/**
	 * Returns the token types that this sniff is interested in.
	 *
	 * @return int[]
	 */
	public function register() {
		return array( T_CLASS );
	}

	/**
	 * Processes the tokens that this sniff is interested in.
	 *
	 * @param File $phpcsFile The file where the token was found.
	 * @param int  $stackPtr The position in the stack where the token was found.
	 * @return void|int Next token or null.
	 */
	public function process( File $phpcsFile, $stackPtr ) {
		$fname = $phpcsFile->getFilename();
		if ( $fname === 'STDIN' ) {
			return $phpcsFile->numTokens;
		}

		if ( ! $this->isTestClass( $phpcsFile, $stackPtr ) ) {
			return;
		}

		$name = $phpcsFile->getDeclarationName( $stackPtr );

		// If it's abstract, it's probably a custom TestCase class rather than an actual test.
		$props = $phpcsFile->getClassProperties( $stackPtr );
		if ( $props['is_abstract'] ) {
			if ( ! str_ends_with( $name, 'TestCase' ) && ! str_ends_with( $name, 'TestBase' ) ) {
				$phpcsFile->addWarning(
					'PHPUnit test case custom base class name \'%s\' should end with \'TestCase\' or \'TestBase\'.',
					$stackPtr,
					'DoesNotEndWithTestCase',
					array( $name )
				);
			}
			return;
		}

		$base = basename( $fname );
		if ( $base !== "$name.php" ) {
			$phpcsFile->addError(
				'PHPUnit test class name \'%s\' does not match filename \'%s\'. This mismatch was deprecated in PHPUnit 9 and fails in PHPUnit 10+.',
				$stackPtr,
				'DoesNotMatchFileName',
				array( $name, $base )
			);
		}

		if ( ! str_ends_with( $name, 'Test' ) ) {
			$phpcsFile->addWarning(
				'PHPUnit test class name \'%s\' should end with \'Test\'.',
				$stackPtr,
				'DoesNotEndWithTest',
				array( $name )
			);
		}
	}
}
