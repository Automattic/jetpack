<?php
/**
 * Utility trait for adding class `use` aliases.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Codesniffer\Utils;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Util\Tokens;
use PHPCSUtils\Internal\Cache;
use PHPCSUtils\Utils\UseStatements;

/**
 * Utility trait for adding class `use` aliases.
 *
 * PHPCS's `-vv` doesn't like fixers in utility classes, but traits used on the sniff class are ok.
 */
trait AddUseClassTrait {

	/**
	 * Add an additional `use` class as a fix.
	 *
	 * Caller is responsible for checking if fixes are enabled.
	 * Caller is also responsible for wrapping this in beginChangeset / endChangeset.
	 *
	 * @param File    $phpcsFile The file where the token was found.
	 * @param array   $nsinfo As returned by `NamespaceInfo::getNamespaceInfo()`.
	 * @param string  $className Class name to `use`.
	 * @param ?string $alias Alias, if any.
	 * @return bool Whether the change was accepted.
	 * @throws \RuntimeException If the alias being added already exists.
	 */
	protected function addUseClass( File $phpcsFile, array $nsinfo, $className, $alias = null ) {
		$classAliases = NamespaceInfo::getClassAliases( $phpcsFile, $nsinfo );

		$className = ltrim( $className, '\\' );
		$statement = "use $className";
		if ( $alias === null ) {
			$i     = strrpos( $className, '\\' );
			$alias = $i === false ? $className : substr( $className, $i + 1 );
		} else {
			$statement .= " as $alias";
		}
		$statement .= ';';

		if ( isset( $classAliases[ $alias ] ) ) {
			if ( $classAliases[ $alias ] === "\\$className" ) {
				return true; // DWIM
			}
			throw new \RuntimeException( "Alias `$alias` already exists for {$classAliases[ $alias ]}, cannot alias to $className." );
		}

		$tokens = $phpcsFile->getTokens();

		$nlStart = '';

		// @phan-suppress-next-line PhanAccessMethodInternal
		if ( Cache::isCached( $phpcsFile, __METHOD__, $nsinfo['nsptr'] ?? '' ) ) {
			// @phan-suppress-next-line PhanAccessMethodInternal
			$data = Cache::get( $phpcsFile, __METHOD__, $nsinfo['nsptr'] ?? '' );
		} else {
			$lastUse = null;
			$idx     = $nsinfo['nsStart'];
			// phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition -- Intentional.
			while ( ( $idx = $phpcsFile->findNext( T_USE, $idx + 1, $nsinfo['nsEnd'] ) ) !== false ) {
				if ( ! UseStatements::isImportUse( $phpcsFile, $idx ) ) {
					continue;
				}
				$lastUse = $idx;
			}

			$data             = array();
			$data['eolStart'] = "\n";
			$data['eolEnd']   = '';
			if ( $lastUse !== null ) {
				$data['useInsertPos'] = $phpcsFile->findEndOfStatement( $lastUse );
				$data['useIndent']    = '';
				$ws                   = $phpcsFile->findFirstOnLine( T_WHITESPACE, $lastUse );
				if ( $ws ) {
					for ( $i = $ws; $i < $lastUse; $i++ ) {
						if ( $tokens[ $i ]['code'] === T_WHITESPACE ) {
							// Handle tabs converted to spaces automatically by using orig_content if available
							$data['useIndent'] .= $tokens[ $i ]['orig_content'] ?? $tokens[ $i ]['content'];
						} else {
							break;
						}
					}
				}
			} else {
				// Skip past comments and whitespace, then back up until we find a whitespace at the start of the line.
				$idx = $phpcsFile->findNext( Tokens::$emptyTokens, $nsinfo['nsStart'] + 1, $nsinfo['nsEnd'], true );
				if ( $idx !== false ) {
					$idx2 = $idx;
					do {
						$idx2 = $phpcsFile->findPrevious( T_WHITESPACE, $idx2 - 1, $nsinfo['nsStart'] );
					} while ( $idx2 !== false && $tokens[ $idx2 ]['column'] > 1 );
					if ( $idx2 !== false ) {
						$idx = $idx2;
					}
					$data['useInsertPos'] = $idx - 1;

					$data['useIndent'] = '';
					$ws                = $phpcsFile->findFirstOnLine( T_WHITESPACE, $data['useInsertPos'] );
					if ( $ws ) {
						for ( $i = $ws; $i < $data['useInsertPos']; $i++ ) {
							if ( $tokens[ $i ]['code'] === T_WHITESPACE ) {
								// Handle tabs converted to spaces automatically by using orig_content if available
								$data['useIndent'] .= $tokens[ $i ]['orig_content'] ?? $tokens[ $i ]['content'];
							} else {
								break;
							}
						}
					}
				} else {
					// No comments or whitespace. Append right after the namespace start.
					$data['useInsertPos'] = $nsinfo['nsStart'];
					$data['useIndent']    = '';
				}

				// When we do this, the newline goes at the end rather than the start. Except the first time through, when we need both.
				$nlStart          = $phpcsFile->eolChar;
				$data['eolStart'] = '';
				$data['eolEnd']   = $phpcsFile->eolChar;
			}

			// @phan-suppress-next-line PhanAccessMethodInternal
			Cache::set( $phpcsFile, __METHOD__, $nsinfo['nsptr'] ?? '', $data );
		}

		return $phpcsFile->fixer->addContent( $data['useInsertPos'], $nlStart . $data['eolStart'] . $data['useIndent'] . $statement . $data['eolEnd'] );
	}
}
