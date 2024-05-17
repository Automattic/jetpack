<?php
/**
 * The setcookie sniff.
 *
 * @package Automattic/jetpack-coding-standards
 */

namespace Automattic\Jetpack\Sniffs\Functions;

use PHP_CodeSniffer\Util\Tokens;
use PHPCSUtils\Tokens\Collections;
use PHPCSUtils\Utils\Arrays;
use PHPCSUtils\Utils\GetTokensAsString;
use PHPCSUtils\Utils\PassedParameters;
use PHPCSUtils\Utils\TextStrings;
use WordPressCS\WordPress\AbstractFunctionParameterSniff;

/**
 * Flag calling setcookie without httponly.
 * *
 *
 * @package Automattic/jetpack-coding-standards
 *
 * @since   2.6.0
 */
class SetCookieSniff extends AbstractFunctionParameterSniff {

	/**
	 * The group name for this group of functions.
	 *
	 * @var string
	 */
	protected $group_name = 'cookie';

	/**
	 * List of setcookie functions to which a $httponly parameter can be passed.
	 *
	 * @link http://php.net/setcookie
	 *
	 * @since 2.6.0
	 * @since $$next-version$$ Value is irrelevant, check is hard-coded because we only ever use this with PHP's setcookie.
	 *
	 * @var array <string function_name> => true
	 */
	protected $target_functions = array(
		'setcookie' => true,
	);

	/**
	 * Process the parameters of a matched function.
	 *
	 * @since 2.6.0
	 *
	 * @param int    $stackPtr        The position of the current token in the stack.
	 * @param string $group_name      The name of the group which was matched.
	 * @param string $matched_content The token content (function name) which was matched.
	 * @param array  $parameters      Array with information about the parameters.
	 *
	 * @return void
	 */
	public function process_parameters( $stackPtr, $group_name, $matched_content, $parameters ) {
		// Is the old-style httponly parameter set? If so, check it.
		$httponlyParam = PassedParameters::getParameterFromStack( $parameters, 7, 'httponly' );
		if ( $httponlyParam ) {
			if ( 'true' !== strtolower( $httponlyParam['raw'] ) ) {
				$this->addHttponlyWarning(
					$httponlyParam['start'],
					'false' === strtolower( $httponlyParam['raw'] ) ? 'FoundNonHTTPOnlyFalse' : 'MissingTrueHTTPOnly',
					$matched_content
				);
			}
			return;
		}

		// Is the new-style options parameter set? If not, warn and return.
		$optionsParam = PassedParameters::getParameterFromStack( $parameters, 3, 'expires_or_options' );
		if ( ! $optionsParam ) {
			$this->addHttponlyWarning( $stackPtr, 'MissingTrueHTTPOnly', $matched_content );
			return;
		}

		// Is it actually an array?
		$arrStart = $this->phpcsFile->findNext( Collections::arrayOpenTokensBC(), $optionsParam['start'], ( $optionsParam['end'] + 1 ) );
		if ( $arrStart === false || ! Arrays::getOpenClose( $this->phpcsFile, $arrStart ) ) {
			$this->addHttponlyWarning( $stackPtr, 'MissingTrueHTTPOnly', $matched_content );
			return;
		}
		$arrayItems    = PassedParameters::getParameters( $this->phpcsFile, $arrStart, 0, true );
		$httponlyPos   = null;
		$httponlyValue = '';
		foreach ( $arrayItems as $arrayItem ) {
			try {
				$arrowPtr = Arrays::getDoubleArrowPtr( $this->phpcsFile, $arrayItem['start'], $arrayItem['end'] );
			} catch ( \RuntimeException $e ) {
				// Parse error: empty array item. Ignore.
				continue;
			}

			if ( $arrowPtr === false ) {
				continue;
			}

			$key = TextStrings::stripQuotes( trim( GetTokensAsString::noComments( $this->phpcsFile, $arrayItem['start'], $arrowPtr - 1 ) ) );
			if ( $key === 'httponly' ) {
				$httponlyPos   = $arrayItem['start'];
				$httponlyValue = trim( GetTokensAsString::noComments( $this->phpcsFile, $arrowPtr + 1, $arrayItem['end'] ) );
			}
		}

		if ( strtolower( $httponlyValue ) !== 'true' ) {
			$this->addHttponlyWarning(
				$httponlyPos ?? $stackPtr,
				'false' === strtolower( $httponlyValue ) ? 'FoundNonHTTPOnlyFalse' : 'MissingTrueHTTPOnly',
				$matched_content
			);
		}
	}

	/**
	 * Helper to set the actual warning.
	 *
	 * @param int    $start Position of the warning.
	 * @param string $errorcode Error code.
	 * @param string $matched_content Matched content.
	 * @return void
	 */
	private function addHttponlyWarning( $start, $errorcode, $matched_content ) {
		$nonEmpty = $this->phpcsFile->findNext( Tokens::$emptyTokens, $start, null, true );

		$this->phpcsFile->addWarning(
			'The %s function requires the httponly parameter to be set to true, unless intentionally disabled.',
			$nonEmpty !== false ? $nonEmpty : $start,
			$errorcode,
			array( $matched_content )
		);
	}
}
