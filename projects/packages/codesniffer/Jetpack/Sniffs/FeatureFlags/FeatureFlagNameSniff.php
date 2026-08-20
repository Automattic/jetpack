<?php
/**
 * Sniff that validates feature flag names passed to Feature_Flags::register().
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\FeatureFlags;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;
use PHP_CodeSniffer\Util\Tokens;
use PHPCSUtils\Utils\PassedParameters;
use PHPCSUtils\Utils\TextStrings;

/**
 * Flags invalid literal feature flag names passed to
 * `Feature_Flags::register()`.
 *
 * The `automattic/jetpack-feature-flags` package requires flag names to match
 * `/^[a-z0-9][a-z0-9_-]*$/`. Rather than validating at runtime, this sniff
 * catches invalid string literals at lint time. Dynamic names (variables,
 * concatenation, function calls) cannot be checked statically and are skipped.
 *
 * Class matching is purely lexical: it keys off the unqualified literal
 * `Feature_Flags`, so an aliased import (`use … as FF; FF::register()`) is not
 * matched, and an unrelated class that happens to be named `Feature_Flags`
 * would be. This is an accepted trade-off for a lint-time convenience check.
 */
class FeatureFlagNameSniff implements Sniff {

	/**
	 * The class whose `register()` calls are checked.
	 *
	 * @var string
	 */
	const CLASS_NAME = 'Feature_Flags';

	/**
	 * The required flag-name pattern.
	 *
	 * @var string
	 */
	const NAME_PATTERN = '/^[a-z0-9][a-z0-9_-]*$/';

	/**
	 * Returns the token types that this sniff is interested in.
	 *
	 * @return array<int|string>
	 */
	public function register() {
		return array( T_STRING );
	}

	/**
	 * Processes the tokens that this sniff is interested in.
	 *
	 * @param File $phpcsFile The file where the token was found.
	 * @param int  $stackPtr  The position of the current token in the stack.
	 * @return void
	 */
	public function process( File $phpcsFile, $stackPtr ) {
		$tokens = $phpcsFile->getTokens();

		// We only care about the `register` method name.
		if ( 'register' !== $tokens[ $stackPtr ]['content'] ) {
			return;
		}

		// It must be a static call on the Feature_Flags class: `Feature_Flags::register`.
		$doubleColon = $phpcsFile->findPrevious( Tokens::$emptyTokens, $stackPtr - 1, null, true );
		if ( false === $doubleColon || T_DOUBLE_COLON !== $tokens[ $doubleColon ]['code'] ) {
			return;
		}
		$className = $phpcsFile->findPrevious( Tokens::$emptyTokens, $doubleColon - 1, null, true );
		if ( false === $className
			|| T_STRING !== $tokens[ $className ]['code']
			|| self::CLASS_NAME !== $tokens[ $className ]['content']
		) {
			return;
		}

		// It must actually be a call (followed by an opening parenthesis).
		$openParen = $phpcsFile->findNext( Tokens::$emptyTokens, $stackPtr + 1, null, true );
		if ( false === $openParen || T_OPEN_PARENTHESIS !== $tokens[ $openParen ]['code'] ) {
			return;
		}

		// Grab the first parameter ($name).
		$parameters = PassedParameters::getParameters( $phpcsFile, $stackPtr );
		if ( ! isset( $parameters[1] ) ) {
			return;
		}
		$param = $parameters[1];

		// Only plain string literals can be checked statically.
		$first = $phpcsFile->findNext( Tokens::$emptyTokens, $param['start'], $param['end'] + 1, true );
		$last  = $phpcsFile->findPrevious( Tokens::$emptyTokens, $param['end'], $param['start'] - 1, true );
		if ( false === $first || $first !== $last || T_CONSTANT_ENCAPSED_STRING !== $tokens[ $first ]['code'] ) {
			return;
		}

		$name = TextStrings::stripQuotes( $tokens[ $first ]['content'] );
		if ( ! preg_match( self::NAME_PATTERN, $name ) ) {
			$phpcsFile->addError(
				'Feature flag name "%s" is invalid. Names must match %s.',
				$first,
				'Invalid',
				array( $name, self::NAME_PATTERN )
			);
		}
	}
}
