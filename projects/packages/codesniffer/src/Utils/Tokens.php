<?php
/**
 * Utility class with some token-related methods.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Codesniffer\Utils;

use PHP_CodeSniffer\Exceptions\RuntimeException;
use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Util\Tokens as PHPCS_Tokens;
use PHPCSUtils\Tokens\Collections;
use PHPCSUtils\Utils\Scopes;

/**
 * Utility class with some token-related methods.
 */
class Tokens {

	/**
	 * List tokens that can preceed a declaration.
	 *
	 * @param File $phpcsFile The file where the token was found.
	 * @param int  $stackPtr Token position. Must be a T_CLASS, T_INTERFACE, T_TRAIT, T_FUNCTION, T_VARIABLE, or T_CONST.
	 * @return array<int|string,int|string> List of tokens. Key and value are the same.
	 * @throws RuntimeException If $stackPtr is not a supported token.
	 */
	public static function tokensPreceedingDeclaration( File $phpcsFile, $stackPtr ) {
		$tokens = $phpcsFile->getTokens();

		$valid = PHPCS_Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END );
		switch ( $tokens[ $stackPtr ]['code'] ) {
			case T_CLASS:
				$valid += Collections::classModifierKeywords();
				break;
			case T_INTERFACE:
			case T_TRAIT:
				// No additional modifiers.
				break;
			case T_FUNCTION:
				// Only methods have additional modifiers.
				if ( Scopes::isOOMethod( $phpcsFile, $stackPtr ) ) {
					$valid += PHPCS_Tokens::$methodPrefixes;
				}
				break;
			case T_VARIABLE:
				if ( ! Scopes::isOOProperty( $phpcsFile, $stackPtr ) ) {
					throw new RuntimeException( 'T_VARIABLE token is not a class/trait property declaration.' );
				}
				$valid += Collections::propertyModifierKeywords() + Collections::propertyTypeTokens();
				break;
			case T_CONST:
				// Only class constants have additional modifiers.
				if ( Scopes::isOOConstant( $phpcsFile, $stackPtr ) ) {
					$valid += Collections::constantModifierKeywords();
				}
				break;
			default:
				throw new RuntimeException( 'Token type "' . $tokens[ $stackPtr ]['type'] . '" is not supported.' );
		}

		return $valid;
	}
}
