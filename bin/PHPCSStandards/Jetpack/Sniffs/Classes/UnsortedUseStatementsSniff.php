<?php
/**
 * Sniff for sorting of `use` statements.
 *
 * Originally taken from MediaWiki's coding conventions.
 *
 * @link https://github.com/wikimedia/mediawiki-tools-codesniffer
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * http://www.gnu.org/copyleft/gpl.html
 *
 * @file
 */

namespace Jetpack\Sniffs\Classes;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;
use PHP_CodeSniffer\Util\Tokens;

class UnsortedUseStatementsSniff implements Sniff {

	// Preferred order is classes → functions → constants
	const ORDER = [ 'function' => 1, 'const' => 2 ];

	/**
	 * @inheritDoc
	 */
	public function register() {
		return [ T_USE ];
	}

	/**
	 * @inheritDoc
	 *
	 * @param File $phpcsFile
	 * @param int $stackPtr
	 * @return int|void
	 */
	public function process( File $phpcsFile, $stackPtr ) {
		$tokens = $phpcsFile->getTokens();

		// Only check use statements in the global scope.
		if ( !empty( $tokens[$stackPtr]['conditions'] ) ) {
			// TODO: Use array_key_first() if available
			$scope = key( $tokens[$stackPtr]['conditions'] );
			return $tokens[$scope]['scope_closer'] === null ? $stackPtr : $tokens[$scope]['scope_closer'];
		}

		$useStatementList = $this->makeUseStatementList( $phpcsFile, $stackPtr );
		// Nothing to do, bail out as fast as possible
		if ( count( $useStatementList ) <= 1 ) {
			return;
		}

		$sortedStatements = $this->sortByFullQualifiedClassName( $useStatementList );

		if ( $useStatementList !== $sortedStatements ) {
			$fix = $phpcsFile->addFixableWarning(
				'Use statements are not alphabetically sorted',
				$stackPtr,
				'UnsortedUse'
			);

			if ( $fix ) {
				$phpcsFile->fixer->beginChangeset();

				foreach ( $useStatementList as $statement ) {
					for ( $i = $statement['start']; $i <= $statement['end']; $i++ ) {
						$phpcsFile->fixer->replaceToken( $i, '' );
					}
					// Also remove the newline at the end of the line, if there is one
					if ( $tokens[$i]['code'] === T_WHITESPACE
						&& $tokens[$i]['line'] < $tokens[$i + 1]['line']
					) {
						$phpcsFile->fixer->replaceToken( $i, '' );
					}
				}

				foreach ( $sortedStatements as $statement ) {
					$phpcsFile->fixer->addContent( $stackPtr, $statement['originalContent'] );
					$phpcsFile->fixer->addNewline( $stackPtr );
				}

				$phpcsFile->fixer->endChangeset();
			}
		}

		// Continue *after* the last use token, to not process it twice
		return end( $useStatementList )['end'] + 1;
	}

	/**
	 * @param File $phpcsFile
	 * @param int $stackPtr
	 * @return array[]
	 */
	private function makeUseStatementList( File $phpcsFile, $stackPtr ) {
		$tokens = $phpcsFile->getTokens();
		$list = [];

		do {
			$originalContent = '';
			$group = 0;
			$sortKey = '';
			$collectSortKey = false;

			// The end condition here is for when a file ends directly after a "use"
			for ( $i = $stackPtr; $i < $phpcsFile->numTokens; $i++ ) {
				$code = $tokens[$i]['code'];
				$content = $tokens[$i]['content'];
				$originalContent .= $content;

				if ( $code === T_STRING ) {
					// Reserved keywords "function" and "const" can not appear anywhere else
					if ( strcasecmp( $content, 'function' ) === 0
						|| strcasecmp( $content, 'const' ) === 0
					) {
						$group = self::ORDER[ strtolower( $content ) ];
					} elseif ( !$sortKey ) {
						// The first non-reserved string is where the class name starts
						$collectSortKey = true;
					}
				} elseif ( $code === T_AS ) {
					// The string after an "as" is not part of the class name any more
					$collectSortKey = false;
				} elseif ( $code === T_SEMICOLON && $sortKey ) {
					$list[] = [
						'start' => $stackPtr,
						'end' => $i,
						'originalContent' => $originalContent,
						'group' => $group,
						// No need to trim(), no spaces or leading backslashes have been collected
						'sortKey' => strtolower( $sortKey ),
					];

					// Try to find the next "use" token after the current one
					$stackPtr = $phpcsFile->findNext( Tokens::$emptyTokens, $i + 1, null, true );
					break;
				} elseif ( isset( Tokens::$emptyTokens[$code] ) ) {
					// We never want any space or comment in the sort key
					continue;
				} elseif ( $code !== T_USE && $code !== T_NS_SEPARATOR ) {
					// Unexpected token, stop searching for more "use" keywords
					break 2;
				}

				if ( $collectSortKey ) {
					$sortKey .= $content;
				}
			}
		} while ( $stackPtr && $tokens[$stackPtr]['code'] === T_USE );

		return $list;
	}

	/**
	 * @param array[] $list
	 * @return array[]
	 */
	private function sortByFullQualifiedClassName( array $list ) {
		usort( $list, function ( array $a, array $b ) {
			if ( $a['group'] !== $b['group'] ) {
				return $b['group'] - $a['group'];
			}
			// Can't use strnatcasecmp() because it behaves different, compared to e.g. PHPStorm
			return strnatcmp( $a['sortKey'], $b['sortKey'] );
		} );

		return $list;
	}

}
