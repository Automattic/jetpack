<?php
/**
 * Utility class with functions for processing doc blocks.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Codesniffer\Utils;

use PHP_CodeSniffer\Exceptions\RuntimeException;
use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Util\Tokens as PHPCS_Tokens;

/**
 * Utility class with functions for processing doc blocks.
 */
class DocBlocks {

	/**
	 * Find the doc block for a class, interface, trait, function, property, constant, or method declaration.
	 *
	 * @param File $phpcsFile The file where the token was found.
	 * @param int  $stackPtr Token position. Must be a T_CLASS, T_INTERFACE, T_TRAIT, T_FUNCTION, T_VARIABLE, or T_CONST.
	 * @return int|false Position of the T_DOC_COMMENT_OPEN_TAG for the class, if any is found.
	 * @throws RuntimeException If $stackPtr is not a supported token.
	 */
	public static function findDocBlockForDeclaration( File $phpcsFile, $stackPtr ) {
		$valid = Tokens::tokensPreceedingDeclaration( $phpcsFile, $stackPtr );
		return Navigation::findPreviousInRun( $phpcsFile, T_DOC_COMMENT_OPEN_TAG, $valid, $stackPtr - 1 );
	}

	/**
	 * Find the token before which to insert a doc block for a declaration.
	 *
	 * Assumes no doc block already exists for the declaration.
	 * If one does exist, the returned insertion point may be before or after it.
	 *
	 * @param File $phpcsFile The file where the token was found.
	 * @param int  $stackPtr Token position. Must be a T_CLASS, T_INTERFACE, T_TRAIT, T_FUNCTION, T_VARIABLE, or T_CONST.
	 * @return int Position to insert a doc block before.
	 * @throws RuntimeException If $stackPtr is not a supported token.
	 */
	public static function findDocBlockInsertionPointForDeclaration( File $phpcsFile, $stackPtr ) {
		$valid = Tokens::tokensPreceedingDeclaration( $phpcsFile, $stackPtr );

		// Find the start of the declaration.
		$idx = Navigation::findStartOfRun( $phpcsFile, $valid, $stackPtr - 1 );
		if ( $idx === false ) {
			// Nothing relevant before it, so insert before the declaration token itself.
			return $stackPtr;
		}

		// Move forward past any leading whitespace or comments. Probably not really part of the declaration.
		$idx2 = $phpcsFile->findNext( PHPCS_Tokens::$emptyTokens, $idx, $stackPtr + 1, true );
		return $idx2 === false ? $idx : $idx2;
	}

	/**
	 * Get tags in a doc comment.
	 *
	 * @param File $phpcsFile The file where the token was found.
	 * @param int  $stackPtr T_DOC_COMMENT_OPEN_TAG token position.
	 * @return array{name:string,content:string,ptr:int,startptr:int,endptr:int}[] Array of tags from the comment.
	 *   - name: (string) Tag name, e.g. `@param`.
	 *   - content: (string) Content of the tag, ignoring any T_DOC_COMMENT_STAR tokens. Whitespace is trimmed.
	 *   - ptr: (int) Location of the T_DOC_COMMENT_TAG token for the tag.
	 *   - startptr: (int) Location of the first token for the tag.
	 *   - endptr: (int) Location of the last token for the tag.
	 * @throws RuntimeException If $stackPtr is not a T_DOC_COMMENT_OPEN_TAG.
	 */
	public static function getCommentTags( File $phpcsFile, $stackPtr ) {
		$tokens = $phpcsFile->getTokens();
		if ( $tokens[ $stackPtr ]['code'] !== T_DOC_COMMENT_OPEN_TAG ) {
			throw new RuntimeException( '$stackPtr must be of type T_DOC_COMMENT_OPEN_TAG' );
		}

		$ret = array();
		foreach ( $tokens[ $stackPtr ]['comment_tags'] as $i => $idx ) {
			$name    = $tokens[ $idx ]['content'];
			$end     = $tokens[ $stackPtr ]['comment_tags'][ $i + 1 ] ?? $tokens[ $stackPtr ]['comment_closer'];
			$content = '';
			for ( $j = $idx + 1; $j < $end; $j++ ) {
				if ( $tokens[ $j ]['code'] !== T_DOC_COMMENT_STAR ) {
					$content .= trim( $tokens[ $j ]['content'], " \t" );
				}
			}

			$idx2  = Navigation::findPreviousInRun( $phpcsFile, T_DOC_COMMENT_WHITESPACE, array( T_DOC_COMMENT_WHITESPACE, T_DOC_COMMENT_STAR ), $idx - 1, null, "\n" );
			$start = $idx2 === false ? $idx : $idx2 + 1;

			$idx2 = Navigation::findPreviousInRun( $phpcsFile, T_DOC_COMMENT_WHITESPACE, array( T_DOC_COMMENT_WHITESPACE, T_DOC_COMMENT_STAR ), $end - 1, null, "\n" );
			$end  = $idx2 === false ? $end - 1 : $idx2;

			$ret[] = array(
				'name'     => $name,
				'content'  => trim( $content ),
				'ptr'      => $idx,
				'startptr' => $start,
				'endptr'   => $end,
			);
		}

		return $ret;
	}

	/**
	 * Get a suggested indent for adding to the doc comment.
	 *
	 * Suggested indent includes the one space before the `*` leading a line.
	 *
	 * @param File $phpcsFile The file where the token was found.
	 * @param int  $stackPtr T_DOC_COMMENT_OPEN_TAG token position.
	 * @return string Suggested indentation.
	 * @throws RuntimeException If $stackPtr is not a T_DOC_COMMENT_OPEN_TAG.
	 */
	public static function getIndent( File $phpcsFile, $stackPtr ) {
		$tokens = $phpcsFile->getTokens();
		if ( $tokens[ $stackPtr ]['code'] !== T_DOC_COMMENT_OPEN_TAG ) {
			throw new RuntimeException( '$stackPtr must be of type T_DOC_COMMENT_OPEN_TAG' );
		}

		// If we can, read the indent of the first T_DOC_COMMENT_STAR. Otherwise try reading the indent of the T_DOC_COMMENT_OPEN_TAG itself and add a space.
		$idx   = $phpcsFile->findNext( T_DOC_COMMENT_STAR, $stackPtr, $tokens[ $stackPtr ]['comment_closer'] );
		$extra = '';
		if ( $idx === false ) {
			$idx   = $stackPtr;
			$extra = ' ';
		}

		$line = $tokens[ $idx ]['line'];
		$ret  = '';
		while ( --$idx >= 0 && $tokens[ $idx ]['line'] === $line ) {
			if ( $tokens[ $idx ]['code'] === T_DOC_COMMENT_WHITESPACE || $tokens[ $idx ]['code'] === T_WHITESPACE ) {
				$ret = ( $tokens[ $idx ]['orig_content'] ?? $tokens[ $idx ]['content'] ) . $ret;
			} else {
				$ret = str_repeat( ' ', strlen( $tokens[ $idx ]['content'] ) ) . $ret;
			}
		}
		return $ret . $extra;
	}
}
