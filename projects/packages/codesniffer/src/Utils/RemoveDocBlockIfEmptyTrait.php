<?php
/**
 * Utility trait for removing empty doc blocks.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Codesniffer\Utils;

use PHP_CodeSniffer\Exceptions\RuntimeException;
use PHP_CodeSniffer\Files\File;

/**
 * Utility trait for removing empty doc blocks.
 *
 * PHPCS's `-vv` doesn't like fixers in utility classes, but traits used on the sniff class are ok.
 */
trait RemoveDocBlockIfEmptyTrait {

	/**
	 * Remove a doc block comment if it's empty.
	 *
	 * Caller is responsible for checking if fixes are enabled.
	 * Caller is also responsible for wrapping this in beginChangeset / endChangeset.
	 *
	 * @param File $phpcsFile The file where the token was found.
	 * @param int  $stackPtr T_DOC_COMMENT_OPEN_TAG for the doc block comment to potentially remove.
	 * @return bool Whether the change was accepted. Not removing a doc block counts as "accepted".
	 * @throws RuntimeException If $stackPtr is not a valid token.
	 */
	protected function removeDocBlockIfEmpty( File $phpcsFile, $stackPtr ) {
		$tokens = $phpcsFile->getTokens();

		if ( $tokens[ $stackPtr ]['code'] !== T_DOC_COMMENT_OPEN_TAG ) {
			throw new RuntimeException( '$stackPtr must be of type T_DOC_COMMENT_OPEN_TAG' );
		}

		$start      = $stackPtr;
		$end        = $tokens[ $stackPtr ]['comment_closer'];
		$hasContent = false;
		for ( $i = $start; $i <= $end; $i++ ) {
			$c = trim( $phpcsFile->fixer->getTokenContent( $i ) );
			if (
				$c !== '' &&
				! ( $tokens[ $i ]['code'] === T_DOC_COMMENT_STAR && $c === '*' ) &&
				! ( $tokens[ $i ]['code'] === T_DOC_COMMENT_OPEN_TAG && $c === '/**' ) &&
				! ( $tokens[ $i ]['code'] === T_DOC_COMMENT_CLOSE_TAG && $c === '*/' )
			) {
				$hasContent = true;
				break;
			}
		}
		if ( $hasContent ) {
			return true;
		}

		$ok = true;

		// If the doc comment is alone on its lines, remove the empty line too.
		$pre  = Navigation::findPreviousInRun( $phpcsFile, T_WHITESPACE, array( T_WHITESPACE ), $start - 1, null, "\n" );
		$post = Navigation::findNextInRun( $phpcsFile, T_WHITESPACE, array( T_WHITESPACE ), $end + 1, null, "\n" );
		if ( $pre !== false && $post !== false ) {
			$start = $pre;
		}

		for ( $i = $start; $i <= $end; $i++ ) {
			if ( $phpcsFile->fixer->getTokenContent( $i ) !== '' ) {
				$ok = $phpcsFile->fixer->replaceToken( $i, '' ) && $ok;
			}
		}

		return $ok;
	}
}
