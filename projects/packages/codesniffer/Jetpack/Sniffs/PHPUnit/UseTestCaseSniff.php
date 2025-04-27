<?php
/**
 * Sniff for "use TestCase as Something" that will confuse other PHPUnit sniffs.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;
use PHPCSUtils\Utils\UseStatements;

/**
 * Sniff for "use TestCase as Something" that will confuse other PHPUnit sniffs.
 */
class UseTestCaseSniff implements Sniff {

	/**
	 * Returns the token types that this sniff is interested in.
	 *
	 * @return int[]
	 */
	public function register() {
		return array( T_USE );
	}

	/**
	 * Processes the tokens that this sniff is interested in.
	 *
	 * @param File $phpcsFile The file where the token was found.
	 * @param int  $stackPtr The position in the stack where the token was found.
	 * @return void|int Next token or null.
	 */
	public function process( File $phpcsFile, $stackPtr ) {
		if ( ! UseStatements::isImportUse( $phpcsFile, $stackPtr ) ) {
			return;
		}

		static $suffixes = array( 'TestCase', 'TestBase' );

		$info = UseStatements::splitImportUseStatement( $phpcsFile, $stackPtr );
		foreach ( $info['name'] as $alias => $name ) {
			foreach ( $suffixes as $suffix ) {
				if ( str_ends_with( $name, $suffix ) && ! str_ends_with( $alias, $suffix ) ) {
					$phpcsFile->addWarning(
						'Alias \'%s\' for likely PHPUnit TestCase class name \'%s\' should end in \'%s\'.',
						$stackPtr,
						"DoesNotEndWith$suffix",
						array( $alias, $name, $suffix )
					);
				}
			}
		}
	}
}
