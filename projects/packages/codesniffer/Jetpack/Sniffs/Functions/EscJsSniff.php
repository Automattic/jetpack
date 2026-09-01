<?php
/**
 * Sniff for use of `esc_js`.
 *
 * @package automattic/jetpack-codesniffer
 */

namespace Automattic\Jetpack\Sniffs\Functions;

use WordPressCS\WordPress\AbstractFunctionRestrictionsSniff;

/**
 * Sniff for use of `esc_js`.
 */
class EscJsSniff extends AbstractFunctionRestrictionsSniff {

	/**
	 * Groups of functions to restrict.
	 *
	 * @return array
	 */
	public function getGroups() {
		return array(
			'esc_js' => array(
				'functions' => array( 'esc_js' ),
			),
		);
	}

	/**
	 * Process a matched token.
	 *
	 * @param int    $stackPtr        The position of the current token in the stack.
	 * @param string $group_name      The name of the group which was matched. Will
	 *                                always be 'deprecated_functions'.
	 * @param string $matched_content The token content (function name) which was matched
	 *                                in lowercase.
	 *
	 * @return void
	 */
	public function process_matched_token( $stackPtr, $group_name, $matched_content ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->phpcsFile->addWarning(
			'`esc_js()` should not be used, it is obsolete and somewhat misleading. Prefer `esc_attr()` and/or `wp_json_encode()` instead.',
			$stackPtr,
			'Found'
		);
	}
}
