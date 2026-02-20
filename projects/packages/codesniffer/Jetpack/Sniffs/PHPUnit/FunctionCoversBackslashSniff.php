<?php
/**
 * Sniff for incorrect use of a backslash in `@covers ::function` and `[#CoversFunction]`.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\PHPUnit;

use Automattic\Jetpack\Codesniffer\Utils\Attributes;
use Automattic\Jetpack\Codesniffer\Utils\DocBlocks;
use Automattic\Jetpack\Codesniffer\Utils\IsTestClassTrait;
use Automattic\Jetpack\Codesniffer\Utils\NamespaceInfo;
use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\UsesFunction;

/**
 * Sniff for incorrect use of a backslash in `@covers ::function` and `[#CoversFunction]`.
 */
class FunctionCoversBackslashSniff implements Sniff {
	use IsTestClassTrait;

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
		if ( ! $this->isTestClass( $phpcsFile, $stackPtr ) ) {
			return;
		}

		$tokens  = $phpcsFile->getTokens();
		$nsinfo  = NamespaceInfo::getNamespaceInfo( $phpcsFile, $stackPtr );
		$aliases = NamespaceInfo::getClassAliases( $phpcsFile, $nsinfo );

		$docBlock = DocBlocks::findDocBlockForDeclaration( $phpcsFile, $stackPtr );
		if ( $docBlock !== false ) {
			foreach ( DocBlocks::getCommentTags( $phpcsFile, $docBlock ) as $ann ) {
				if ( $ann['name'] !== '@covers' && $ann['name'] !== '@uses' ) {
					continue;
				}
				if ( ! str_starts_with( $ann['content'], '::\\' ) ) {
					continue;
				}

				$which = substr( $ann['name'], 1 );
				$idx   = $phpcsFile->findNext( array( T_DOC_COMMENT_STRING ), $ann['ptr'] + 1, $ann['endptr'] + 1 );

				$ok = $phpcsFile->addError(
					"Function name for `{$ann['name']}` must not include a leading backslash.",
					$ann['ptr'],
					ucfirst( "{$which}FunctionAnnotationBackslashFound" ),
					array(),
					0,
					$idx !== false
				);
				if ( $ok && $idx !== false && $phpcsFile->fixer->enabled ) {
					$phpcsFile->fixer->replaceToken( $idx, '::' . ltrim( substr( $tokens[ $idx ]['content'], 2 ), '\\' ) );
				}
			}
		}

		foreach ( Attributes::getAttributesForDeclaration( $phpcsFile, $stackPtr ) as $att ) {
			$att['name'] = ltrim( NamespaceInfo::qualifyClassName( $att['name'], $nsinfo['name'], $aliases ), '\\' );
			if ( $att['name'] !== CoversFunction::class && $att['name'] !== UsesFunction::class ) {
				continue;
			}
			if ( ! isset( $att['params'][1] ) ||
				! str_starts_with( $att['params'][1]['clean'], "'\\" ) && ! str_starts_with( $att['params'][1]['clean'], '"\\' )
			) {
				continue;
			}

			$which = $att['name'] === CoversFunction::class ? 'Covers' : 'Uses';
			$idx   = $phpcsFile->findNext( array( T_DOUBLE_QUOTED_STRING, T_CONSTANT_ENCAPSED_STRING ), $att['params'][1]['start'], $att['params'][1]['end'] );

			$ok = $phpcsFile->addError(
				"Function name for `{$att['name']}` must not include a leading backslash.",
				$idx !== false ? $idx : $att['params'][1]['start'],
				"{$which}FunctionAttributeBackslashFound",
				array(),
				0,
				$idx !== false
			);
			if ( $ok && $idx !== false && $phpcsFile->fixer->enabled ) {
				$c = $tokens[ $idx ]['content'];
				$phpcsFile->fixer->replaceToken( $idx, substr( $c, 0, 1 ) . ltrim( substr( $c, 1 ), '\\' ) );
			}
		}
	}
}
