<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Sniff for sorting of `use` statements.
 *
 * Originally taken from MediaWiki's coding conventions, then heavily munged
 * for WordPress's coding conventions.
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
 * @package Jetpack
 */

namespace Jetpack\Sniffs\Classes;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;
use PHP_CodeSniffer\Util\Tokens;

/**
 * Sniff for sorting of `use` statements.
 */
class UnsortedUseStatementsSniff implements Sniff {

	// Preferred order is classes → functions → constants.
	const ORDER = array(
		'function' => 1,
		'const'    => 2,
	);

	/**
	 * Returns the token types that this sniff is interested in.
	 *
	 * @return array(int)
	 */
	public function register() {
		return array( T_USE );
	}

	/**
	 * Processes the tokens that this sniff is interested in.
	 *
	 * @param File $phpcs_file The file where the token was found.
	 * @param int  $stack_ptr The position in the stack where the token was found.
	 * @return int|void
	 */
	public function process( File $phpcs_file, $stack_ptr ) {
		$tokens = $phpcs_file->getTokens();

		// Only check use statements in the global scope.
		if ( ! empty( $tokens[ $stack_ptr ]['conditions'] ) ) {
			// TODO: Use array_key_first() if available.
			$scope = key( $tokens[ $stack_ptr ]['conditions'] );
			return null === $tokens[ $scope ]['scope_closer'] ? $stack_ptr : $tokens[ $scope ]['scope_closer'];
		}

		$use_statement_list = $this->makeUseStatementList( $phpcs_file, $stack_ptr );
		// Nothing to do, bail out as fast as possible.
		if ( count( $use_statement_list ) <= 1 ) {
			return;
		}

		$sorted_statements = $this->sortByFullQualifiedClassName( $use_statement_list );

		if ( $use_statement_list !== $sorted_statements ) {
			$fix = $phpcs_file->addFixableWarning(
				'Use statements are not alphabetically sorted',
				$stack_ptr,
				'UnsortedUse'
			);

			if ( $fix ) {
				$phpcs_file->fixer->beginChangeset();

				foreach ( $use_statement_list as $statement ) {
					for ( $i = $statement['start']; $i <= $statement['end']; $i++ ) {
						$phpcs_file->fixer->replaceToken( $i, '' );
					}
					// Also remove the newline at the end of the line, if there is one.
					if ( T_WHITESPACE === $tokens[ $i ]['code']
						&& $tokens[ $i ]['line'] < $tokens[ $i + 1 ]['line']
					) {
						$phpcs_file->fixer->replaceToken( $i, '' );
					}
				}

				foreach ( $sorted_statements as $statement ) {
					$phpcs_file->fixer->addContent( $stack_ptr, $statement['originalContent'] );
					$phpcs_file->fixer->addNewline( $stack_ptr );
				}

				$phpcs_file->fixer->endChangeset();
			}
		}

		// Continue *after* the last use token, to not process it twice.
		return end( $use_statement_list )['end'] + 1;
	}

	/**
	 * Collect the list of `use` statements.
	 *
	 * @param File $phpcs_file The file where the token was found.
	 * @param int  $stack_ptr The position in the stack where the token was found.
	 * @return array[]
	 */
	private function makeUseStatementList( File $phpcs_file, $stack_ptr ) {
		$tokens = $phpcs_file->getTokens();
		$list   = array();

		do {
			$original_content = '';
			$group            = 0;
			$sort_key         = '';
			$collect_sort_key = false;

			// The end condition here is for when a file ends directly after a "use".
			for ( $i = $stack_ptr; $i < $phpcs_file->numTokens; $i++ ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$code              = $tokens[ $i ]['code'];
				$content           = $tokens[ $i ]['content'];
				$original_content .= $content;

				if ( T_STRING === $code ) {
					// Reserved keywords "function" and "const" can not appear anywhere else.
					if ( strcasecmp( $content, 'function' ) === 0
						|| strcasecmp( $content, 'const' ) === 0
					) {
						$group = self::ORDER[ strtolower( $content ) ];
					} elseif ( ! $sort_key ) {
						// The first non-reserved string is where the class name starts.
						$collect_sort_key = true;
					}
				} elseif ( T_AS === $code ) {
					// The string after an "as" is not part of the class name any more.
					$collect_sort_key = false;
				} elseif ( T_SEMICOLON === $code && $sort_key ) {
					$list[] = array(
						'start'           => $stack_ptr,
						'end'             => $i,
						'originalContent' => $original_content,
						'group'           => $group,
						// No need to trim(), no spaces or leading backslashes have been collected.
						'sortKey'         => strtolower( $sort_key ),
					);

					// Try to find the next "use" token after the current one.
					// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					$stack_ptr = $phpcs_file->findNext( Tokens::$emptyTokens, $i + 1, null, true );
					break;
				} elseif ( isset( Tokens::$emptyTokens[ $code ] ) ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
					// We never want any space or comment in the sort key.
					continue;
				} elseif ( T_USE !== $code && T_NS_SEPARATOR !== $code ) {
					// Unexpected token, stop searching for more "use" keywords.
					break 2;
				}

				if ( $collect_sort_key ) {
					$sort_key .= $content;
				}
			}
		} while ( $stack_ptr && T_USE === $tokens[ $stack_ptr ]['code'] );

		return $list;
	}

	/**
	 * Sort a list of `use` data structures by class name.
	 *
	 * @param array[] $list List to sort.
	 * @return array[]
	 */
	private function sortByFullQualifiedClassName( array $list ) {
		usort(
			$list,
			function ( array $a, array $b ) {
				if ( $a['group'] !== $b['group'] ) {
					return $b['group'] - $a['group'];
				}
				// Can't use strnatcasecmp() because it behaves different, compared to e.g. PHPStorm.
				return strnatcmp( $a['sortKey'], $b['sortKey'] );
			}
		);

		return $list;
	}

}
