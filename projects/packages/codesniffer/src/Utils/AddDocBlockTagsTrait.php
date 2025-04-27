<?php
/**
 * Utility trait for adding tags to doc blocks.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Codesniffer\Utils;

use PHP_CodeSniffer\Exceptions\RuntimeException;
use PHP_CodeSniffer\Files\File;
use PHPCSUtils\Internal\Cache;

/**
 * Utility trait for adding tags to doc blocks.
 *
 * PHPCS's `-vv` doesn't like fixers in utility classes, but traits used on the sniff class are ok.
 */
trait AddDocBlockTagsTrait {

	/**
	 * Add tags to a doc block comment. Add a comment if none exists.
	 *
	 * Caller is responsible for checking if fixes are enabled.
	 * Caller is also responsible for wrapping this in beginChangeset / endChangeset.
	 *
	 * @param File     $phpcsFile The file where the token was found.
	 * @param int      $stackPtr Where to insert the tags.
	 *    If a T_DOC_COMMENT_OPEN_TAG or T_DOC_COMMENT_CLOSE_TAG, appends the tags to the doc comment.
	 *    If a T_DOC_COMMENT_TAG, inserts tags before that tag.
	 *    If `DocBlocks::findDocBlockForDeclaration()` finds a doc block, appends to that doc comment.
	 *    Otherwise, a doc block containing the tags is inserted at `DocBlocks::findDocBlockInsertionPointForDeclaration()`.
	 * @param string[] $tags Tags to add. Each entry should be a single tag, and content may contain newlines.
	 * @return bool Whether the change was accepted.
	 * @throws RuntimeException If $stackPtr is not a valid token.
	 */
	protected function addDocBlockTags( File $phpcsFile, $stackPtr, array $tags ) {
		if ( ! $tags ) { // Nothing to do, so do nothing.
			return true;
		}

		$tokens = $phpcsFile->getTokens();

		// @phan-suppress-next-line PhanAccessMethodInternal
		if ( Cache::isCached( $phpcsFile, __METHOD__, $stackPtr ) ) {
			// We had a previous insert. Fetch the data about it and amend.
			// @phan-suppress-next-line PhanAccessMethodInternal
			list( $insPtr, $indent, $prevcontent ) = Cache::get( $phpcsFile, __METHOD__, $stackPtr );
			$content                               = $phpcsFile->fixer->getTokenContent( $insPtr );
			if ( ! str_starts_with( $content, $prevcontent ) ) {
				// Too bad we can't just tell the fixer there was a conflict and return false.
				throw new RuntimeException( 'Unsafe multiple call to ' . __METHOD__ . ":\n<<<<<<<\n$prevcontent\n=======\n$content\n>>>>>>>" );
			}

			$toAdd = $prevcontent;
			foreach ( $tags as $tag ) {
				$toAdd .= "$indent* " . str_replace( "\n", "\n$indent*  ", $tag ) . "\n";
			}

			$newcontent   = $toAdd . substr( $content, strlen( $prevcontent ) );
			$ok           = $phpcsFile->fixer->replaceToken( $insPtr, $newcontent );
			$addedcontent = $toAdd;
		} else {
			// Determine doc block pointer and insert-before pointer.
			if ( $tokens[ $stackPtr ]['code'] === T_DOC_COMMENT_OPEN_TAG ) {
				$docPtr = $stackPtr;
				$insPtr = $tokens[ $docPtr ]['comment_closer'];
			} elseif ( $tokens[ $stackPtr ]['code'] === T_DOC_COMMENT_CLOSE_TAG ) {
				$docPtr = $tokens[ $stackPtr ]['comment_opener'];
				$insPtr = $tokens[ $docPtr ]['comment_closer'];
			} elseif ( $tokens[ $stackPtr ]['code'] === T_DOC_COMMENT_TAG ) {
				$docPtr = $phpcsFile->findPrevious( T_DOC_COMMENT_OPEN_TAG, $stackPtr );
				$insPtr = $stackPtr;
			} else {
				$docPtr = DocBlocks::findDocBlockForDeclaration( $phpcsFile, $stackPtr );
				$insPtr = $docPtr !== false ? $tokens[ $docPtr ]['comment_closer'] : false;
			}

			if ( $insPtr !== false ) {
				$line = $tokens[ $insPtr ]['line'];
				while ( $insPtr >= 0 && $tokens[ $insPtr - 1 ]['line'] === $line && ( $tokens[ $insPtr - 1 ]['code'] === T_DOC_COMMENT_WHITESPACE || $tokens[ $insPtr - 1 ]['code'] === T_DOC_COMMENT_STAR ) ) {
					--$insPtr;
				}
				$indent    = DocBlocks::getIndent( $phpcsFile, $docPtr );
				$toAdd     = '';
				$docInsert = 0; // Make phan happy.
			} else {
				// No doc block, we have to add one.
				$idx    = DocBlocks::findDocBlockInsertionPointForDeclaration( $phpcsFile, $stackPtr );
				$line   = $tokens[ $idx ]['line'];
				$nl     = '';
				$indent = '';
				while ( --$idx >= 0 && $tokens[ $idx ]['line'] === $line ) {
					if ( $tokens[ $idx ]['code'] === T_WHITESPACE ) {
						$indent = $phpcsFile->fixer->getTokenContent( $idx ) . $indent;
					} else {
						$nl = "\n";
						break;
					}
				}
				$docInsert = $idx + 1;
				$toAdd     = "$nl$indent/**\n";
				$indent   .= ' ';
			}

			foreach ( $tags as $tag ) {
				$toAdd .= "$indent* " . str_replace( "\n", "\n$indent*  ", $tag ) . "\n";
			}

			if ( $insPtr !== false ) {
				// Check if we need to insert a newline before.
				$idx = $insPtr - 1;
				while ( $phpcsFile->fixer->getTokenContent( $idx ) === '' ) {
					--$idx;
				}
				$prev = $phpcsFile->fixer->getTokenContent( $idx );

				$addedcontent = $toAdd;
				if ( ! str_ends_with( $prev, "\n" ) ) {
					$addedcontent = "\n$addedcontent";
					$toAdd        = "$addedcontent$indent";
					if ( $tokens[ $stackPtr ]['code'] === T_DOC_COMMENT_TAG ) {
						$toAdd .= '*';
					}
					$newprev = rtrim( $prev, " \t" );
					if ( $newprev !== $prev ) {
						$phpcsFile->fixer->replaceToken( $idx, $newprev );
					}
				}
				$ok = $phpcsFile->fixer->addContentBefore( $insPtr, $toAdd );
			} else {
				$insPtr       = $docInsert;
				$addedcontent = $toAdd;
				$ok           = $phpcsFile->fixer->addContentBefore( $insPtr, "$addedcontent$indent*/\n" );
			}
		}

		if ( $ok ) {
			// @phan-suppress-next-line PhanAccessMethodInternal
			Cache::set( $phpcsFile, __METHOD__, $stackPtr, array( $insPtr, $indent, $addedcontent ) );
		}

		return $ok;
	}
}
