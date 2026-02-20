<?php
/**
 * Sniff for use of flags with `json_encode`.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\Functions;

use InvalidArgumentException;
use PHP_CodeSniffer\Util\Tokens;
use PHPCSUtils\Utils\PassedParameters;
use WordPressCS\WordPress\AbstractFunctionParameterSniff;

/**
 * Flag calling `json_encode()`, `wp_json_encode()`, and the like without the second ($flags) parameter.
 */
class JsonEncodeFlagsSniff extends AbstractFunctionParameterSniff {

	/**
	 * The group name for this group of functions.
	 *
	 * @var string
	 */
	protected $group_name = 'json_encode';

	/**
	 * List of functions this sniff should examine.
	 *
	 * @var array<string, int> Key is function name, value is the (one-based) index of the flags parameter.
	 */
	protected $target_functions = array(
		'json_encode'          => 2,
		'wp_json_encode'       => 2,
		'wp_send_json'         => 3,
		'wp_send_json_success' => 3,
		'wp_send_json_error'   => 3,
	);

	/**
	 * List of functions this sniff should examine, besides the defaults.
	 *
	 * @var array<string, int> Key is function name, value is the (one-based) index of the flags parameter. Set 0 to disable a function.
	 */
	public $json_encode_functions = array();

	/**
	 * Recommendations doc link.
	 *
	 * @var string
	 */
	public $help_link = 'https://github.com/Automattic/jetpack-codesniffer/tree/trunk/docs/Jetpack.Functions.JsonEncodeFlags.Recommendations.md';

	/**
	 * Groups of functions to restrict.
	 *
	 * @return array<string, array<string, array<string>>>
	 */
	public function getGroups() {
		$this->target_functions = array_filter( array_merge( $this->target_functions, $this->json_encode_functions ) );
		return parent::getGroups();
	}

	/**
	 * Process the parameters of a matched function.
	 *
	 * @param int    $stackPtr        The position of the current token in the stack.
	 * @param string $group_name      The name of the group which was matched.
	 * @param string $matched_content The token content (function name) which was matched
	 *                                in lowercase.
	 * @param array  $parameters      Array with information about the parameters.
	 * @return void
	 * @throws InvalidArgumentException If somehow called with invalid `$matched_content`.
	 */
	public function process_parameters( $stackPtr, $group_name, $matched_content, $parameters ) {
		if ( ! isset( $this->target_functions[ $matched_content ] ) ) {
			throw new InvalidArgumentException( "Unexpected function name `$matched_content`" );
		}

		$flags = PassedParameters::getParameterFromStack( $parameters, $this->target_functions[ $matched_content ], 'flags' );
		if ( $flags === false ) {
			$this->phpcsFile->addWarning(
				'Passing the `$flags` parameter to `%s()` is strongly recommended, as the default value is often insecure. See %s for recommendations.',
				$stackPtr,
				'Missing',
				array(
					$matched_content,
					$this->help_link,
				),
			);
			return;
		}

		if ( $flags['clean'] === '0' ) {
			$this->phpcsFile->addWarning(
				'Passing 0 for the `$flags` parameter to `%s()` is strongly discouraged, as the default value is often insecure. See %s for recommendations.',
				$this->phpcsFile->findNext( Tokens::$emptyTokens, $flags['start'], $flags['end'], true ),
				'ZeroFound',
				array(
					$matched_content,
					$this->help_link,
				),
			);
		}
	}

	/**
	 * Process the function if no parameters were found.
	 *
	 * @param int    $stackPtr        The position of the current token in the stack.
	 * @param string $group_name      The name of the group which was matched.
	 * @param string $matched_content The token content (function name) which was matched
	 *                                in lowercase.
	 * @return int|void Integer stack pointer to skip forward or void to continue
	 *                  normal file processing.
	 */
	public function process_no_parameters( $stackPtr, $group_name, $matched_content ) {
		return $this->process_parameters( $stackPtr, $group_name, $matched_content, array() );
	}
}
