<?php
/**
 * Utility class with functions for processing attributes.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Codesniffer\Utils;

use PHP_CodeSniffer\Exceptions\RuntimeException;
use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Util\Tokens as PHPCS_Tokens;
use PHPCSUtils\Utils\PassedParameters;
use PHPCSUtils\Utils\Scopes;

/**
 * Utility class with functions for processing attributes.
 */
class Attributes {

	/**
	 * Find attributes for a declaration.
	 *
	 * Regarding `start` and `end`:
	 * - For a simple attribute like `#[Attribute( params )]`, start and end are the `T_ATTRIBUTE` and `T_ATTRIBUTE_END` tokens.
	 * - For a multiple-attribute declaration like `#[Attribute1( params ), Attribute2( params )]`, start and end for each attribute excludes
	 *   the `T_ATTRIBUTE`, `T_ATTRIBUTE_END`, `T_COMMA`, and any adjacent "empty" tokens.
	 *
	 * @param File $phpcsFile The file where the token was found.
	 * @param int  $stackPtr Token position. Must be a T_CLASS, T_INTERFACE, T_TRAIT, T_FUNCTION, T_VARIABLE, or T_CONST.
	 * @return array{name:string,ptr:int,params:?array,start:int,end:int,isMulti:bool,attstart:int,attend:int}[] Array of attributes.
	 *   - name: (string) Attribute name.
	 *   - ptr: (int) Location of the T_STRING token for the attribute name.
	 *   - params: (?array) Parameter data (as from `PassedParameters::getParameters()`), if any parameters are passed.
	 *   - start: (int) Location of the first token for the attribute.
	 *   - end: (int) Location of the last token for the attribute.
	 *   - isMulti: (bool) Whether this came from a multiple-attribute declaration.
	 *   - attstart: (int) Location of the `T_ATTRIBUTE` token.
	 *   - attend: (int) Location of the `T_ATTRIBUTE_END` token.
	 * @throws RuntimeException If $stackPtr is not a supported token.
	 */
	public static function getAttributesForDeclaration( File $phpcsFile, $stackPtr ) {
		$tokens = $phpcsFile->getTokens();
		if ( $tokens[ $stackPtr ]['code'] === T_CONST && ! Scopes::isOOConstant( $phpcsFile, $stackPtr ) ) {
			throw new RuntimeException( 'T_CONST token is not a class/trait constant declaration.' );
		}

		$valid = Tokens::tokensPreceedingDeclaration( $phpcsFile, $stackPtr );

		$start = Navigation::findStartOfRun( $phpcsFile, $valid, $stackPtr - 1 );
		if ( $start === false ) {
			return array();
		}

		$nstokens = array(
			T_NS_SEPARATOR,
			T_STRING,
			T_NAMESPACE,
		);

		$attributes = array();
		$next       = $start;

		// The `#[...]` "attribute" construct can contain multiple attributes. Basically it's
		// T_ATTRIBUTE, nstokens, optional parenthesized parameters, ( comma, nstokens, optional parenthesized parameters ), T_ATTRIBUTE_END
		// (ignoring whitespace and comments that may be in the middle).
		// phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.FoundInWhileCondition -- Intentional.
		while ( ( $idx = Navigation::findNextInRun( $phpcsFile, T_ATTRIBUTE, $valid, $next ) ) !== false ) {
			$attrstart = $idx;
			$next      = $tokens[ $idx ]['attribute_closer'];

			$isMulti = false;
			while ( $idx !== false && $idx < $next ) {
				// Get the attribute class name.
				$namestart = $phpcsFile->findNext( $nstokens, $idx, $next );
				$nameend   = $phpcsFile->findNext( $nstokens, $namestart, $next + 1, true );
				$name      = $phpcsFile->getTokensAsString( $namestart, $nameend - $namestart );

				// Parameters, if any.
				$params = null;
				$paren  = Navigation::findNextInRun( $phpcsFile, T_OPEN_PARENTHESIS, PHPCS_Tokens::$emptyTokens, $nameend );
				if ( $paren !== false ) {
					$params = PassedParameters::getParameters( $phpcsFile, $nameend - 1 );
				}

				$attrend = $paren ? $tokens[ $paren ]['parenthesis_closer'] : $nameend - 1;

				// See if we have a comma, indicating another attribute follows.
				$idx = $phpcsFile->findNext( PHPCS_Tokens::$emptyTokens, $attrend + 1, $next + 1, true );
				if ( $tokens[ $idx ]['code'] === T_COMMA ) {
					$isMulti = true;
					$idx     = $phpcsFile->findNext( PHPCS_Tokens::$emptyTokens, $idx + 1, $next + 1, true );
				} else {
					$idx = false;
				}

				$attributes[] = array(
					'name'     => $name,
					'ptr'      => $nameend - 1,
					'params'   => $params,
					'start'    => $isMulti ? $namestart : $attrstart,
					'end'      => $isMulti ? $attrend : $next,
					'isMulti'  => $isMulti,
					'attstart' => $attrstart,
					'attend'   => $next,
				);
			}
		}

		return $attributes;
	}

	/**
	 * Find the token before which to insert an attribute for a declaration.
	 *
	 * @param File $phpcsFile The file where the token was found.
	 * @param int  $stackPtr Token position. Must be a T_CLASS, T_INTERFACE, T_TRAIT, T_FUNCTION, T_VARIABLE, or T_CONST.
	 * @return int Position to insert a doc block before.
	 * @throws RuntimeException If $stackPtr is not a supported token.
	 */
	public static function findAttributeInsertionPointForDeclaration( File $phpcsFile, $stackPtr ) {
		static $emptyNonDocComment = null;
		if ( $emptyNonDocComment === null ) {
			$emptyNonDocComment = array(
				T_WHITESPACE => T_WHITESPACE,
				T_COMMENT    => T_WHITESPACE,
			) + PHPCS_Tokens::$phpcsCommentTokens;
		}

		$valid = Tokens::tokensPreceedingDeclaration( $phpcsFile, $stackPtr );

		// First, look for the last attribute. Insert just after that if possible.
		$idx = Navigation::findPreviousInRun( $phpcsFile, T_ATTRIBUTE_END, $valid, $stackPtr - 1 );
		if ( $idx !== false ) {
			// Forward to start of next line, if we can.
			$idx2 = Navigation::findNextInRun( $phpcsFile, T_WHITESPACE, $emptyNonDocComment, $idx + 1, null, "\n" );
			if ( $idx2 !== false ) {
				return $idx2 + 1;
			}
			$idx2 = Navigation::findEndOfRun( $phpcsFile, PHPCS_Tokens::$emptyTokens, $idx + 1 );
			return $idx2 === false ? $idx + 1 : $idx2 + 1;
		}

		// No existing attributes. Insert after any comments preceeding the declaration.
		$idx = Navigation::findStartOfRun( $phpcsFile, $valid, $stackPtr - 1 );
		if ( $idx === false ) {
			// Nothing relevant before it at all, so insert before the declaration token itself.
			return $stackPtr;
		}

		// Move forward past any leading whitespace or comments.
		$idx2 = Navigation::findEndOfRun( $phpcsFile, PHPCS_Tokens::$emptyTokens, $idx );
		if ( $idx2 === false ) {
			return $idx;
		}

		// Back up to start of line, if possible.
		$idx3 = Navigation::findPreviousInRun( $phpcsFile, T_WHITESPACE, $emptyNonDocComment, $idx2, null, "\n" );
		return $idx3 === false ? $idx2 : $idx3 + 1;
	}
}
