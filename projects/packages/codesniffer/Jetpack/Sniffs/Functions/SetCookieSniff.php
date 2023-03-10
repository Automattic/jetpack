<?php
/**
 * The setcookie sniff.
 *
 * @package Automattic/jetpack-coding-standards
 */

namespace Automattic\Jetpack\Sniffs\Functions;

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
	 *
	 * @var array <string function_name> => array( <bool always needed ?>, <int parameter number ?> )
	 */
	protected $target_functions = array(
		'setcookie' => array(
			'require' => true,
			'param'   => 7,
		),
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
		// Check if the check is actually needed.
		if ( false === $this->target_functions[ $matched_content ] ) {
			if ( \count( $parameters ) === 1 ) {
				return;
			}
		}

		// We're only interested in the third parameter.
		$param = $this->target_functions[ $matched_content ]['param'];
		if ( false === isset( $parameters[ $param ] ) || 'true' !== strtolower( $parameters[ $param ]['raw'] ) ) {
			$errorcode = 'MissingTrueHTTPOnly';

			/*
			 * Use a different error code when `false` is found to allow for excluding
			 * the warning as this will be a conscious choice made by the dev.
			 */
			if ( isset( $parameters[ $param ] ) && 'false' === strtolower( $parameters[ $param ]['raw'] ) ) {
				$errorcode = 'FoundNonHTTPOnlyFalse';
			}

			$this->phpcsFile->addWarning(
				'The %s function requires the httponly parameter to be set to true, unless intentionally disabled.',
				( isset( $parameters[ $param ]['start'] ) ? $parameters[ $param ]['start'] : $parameters[1]['start'] ),
				$errorcode,
				array( $matched_content )
			);
		}
	}

}
