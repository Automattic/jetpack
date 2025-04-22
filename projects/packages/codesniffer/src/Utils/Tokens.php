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
	 * Cache.
	 *
	 * @var array
	 */
	private static $cache = array();

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

		self::$cache[ __METHOD__ ]['valid'] ??= PHPCS_Tokens::$emptyTokens + array( T_ATTRIBUTE_END => T_ATTRIBUTE_END );
		switch ( $tokens[ $stackPtr ]['code'] ) {
			case T_CLASS:
				self::$cache[ __METHOD__ ]['class'] ??= self::$cache[ __METHOD__ ]['valid'] + Collections::classModifierKeywords();
				return self::$cache[ __METHOD__ ]['class'];

			case T_INTERFACE:
			case T_TRAIT:
				// No additional modifiers.
				return self::$cache[ __METHOD__ ]['valid'];

			case T_FUNCTION:
				// Only methods have additional modifiers.
				if ( Scopes::isOOMethod( $phpcsFile, $stackPtr ) ) {
					self::$cache[ __METHOD__ ]['method'] ??= self::$cache[ __METHOD__ ]['valid'] + PHPCS_Tokens::$methodPrefixes;
					return self::$cache[ __METHOD__ ]['method'];
				}
				return self::$cache[ __METHOD__ ]['valid'];

			case T_VARIABLE:
				if ( ! Scopes::isOOProperty( $phpcsFile, $stackPtr ) ) {
					throw new RuntimeException( 'T_VARIABLE token is not a class/trait property declaration.' );
				}
				self::$cache[ __METHOD__ ]['var'] ??= self::$cache[ __METHOD__ ]['valid'] + Collections::propertyModifierKeywords() + Collections::propertyTypeTokens();
				return self::$cache[ __METHOD__ ]['var'];

			case T_CONST:
				// Only class constants have additional modifiers.
				if ( Scopes::isOOConstant( $phpcsFile, $stackPtr ) ) {
					self::$cache[ __METHOD__ ]['class const'] ??= self::$cache[ __METHOD__ ]['valid'] + Collections::constantModifierKeywords();
					return self::$cache[ __METHOD__ ]['class const'];
				}
				return self::$cache[ __METHOD__ ]['valid'];

			default:
				throw new RuntimeException( 'Token type "' . $tokens[ $stackPtr ]['type'] . '" is not supported.' );
		}
	}
}
