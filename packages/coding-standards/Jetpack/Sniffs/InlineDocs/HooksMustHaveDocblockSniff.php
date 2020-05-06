<?php
/**
 * This sniff verifies a WordPress hook function has a preceding docblock.
 *
 * @package   automattic/jetpack-coding-standards
 */

namespace Automattic\Jetpack\CodingStandards\Sniffs\InlineDocs;

use WordPressCS\WordPress\AbstractFunctionRestrictionsSniff;
use PHP_CodeSniffer\Util\Tokens;

class HooksMustHaveDocblockSniff extends AbstractFunctionRestrictionsSniff {

	protected $hook_functions = array(
		'apply_filters' => 'filter',
		'apply_filters_ref_array' => 'filter',
		'apply_filters_deprecated' => 'filter',
		'do_action' => 'action',
		'do_action_ref_array' => 'action',
		'do_action_deprecated' => 'action',
	);

	/**
	 * Groups of functions to restrict.
	 *
	 * Example: groups => array(
	 *  'lambda' => array(
	 *      'type'      => 'error' | 'warning',
	 *      'message'   => 'Use anonymous functions instead please!',
	 *      'functions' => array( 'file_get_contents', 'create_function' ),
	 *  )
	 * )
	 *
	 * @return array
	 */
	public function getGroups() {
		return array(
			'hooks' => array(
				'functions' => array_keys( $this->hook_functions ),
			),
		);
	}

	/**
	 * Process a matched token.
	 *
	 * @since 1.0.0 Logic split off from the `process_token()` method.
	 *
	 * @param int    $stack_ptr       The position of the current token in the stack.
	 * @param string $group_name      The name of the group which was matched.
	 * @param string $matched_content The token content (function name) which was matched.
	 *
	 * @return int|void Integer stack pointer to skip forward or void to continue
	 *                  normal file processing.
	 */
	public function process_matched_token( $stack_ptr, $group_name, $matched_content ) {

		$func_open_paren_token = $this->phpcsFile->findNext( Tokens::$emptyTokens, ( $stack_ptr + 1 ), null, true );
		if ( false === $func_open_paren_token
		     || \T_OPEN_PARENTHESIS !== $this->tokens[ $func_open_paren_token ]['code']
		     || ! isset( $this->tokens[ $func_open_paren_token ]['parenthesis_closer'] )
		) {
			// Live coding, parse error or not a function call.
			return;
		}

		/*
		if ( \in_array( $matched_content, array( 'apply_filters' ), true ) ) {
			$this->phpcsFile->addWarning( 'Use of the "%s()" function is reserved for low-level API usage.', $stack_ptr, 'LowLevelTranslationFunction', array( $matched_content ) );
		}
		*/

		$previous_comment = $this->phpcsFile->findPrevious( Tokens::$commentTokens, ( $stack_ptr - 1 ) );

		if ( false !== $previous_comment ) {
			/*
			 * Check that the comment is either on the line before the gettext call or
			 * if it's not, that there is only whitespace between.
			 */
			$correctly_placed = false;

			if ( ( $this->tokens[ $previous_comment ]['line'] + 1 ) !== $this->tokens[ $stack_ptr ]['line'] ) {
				$this->phpcsFile->addError(
					'The inline documentation for a hook must be on the line immediately before the function call.',
					$stack_ptr,
					'DocMustBePreceding'
				);
			}

			/*
			 * Check that the comment starts is a docblock.
			 */
			if ( \T_DOC_COMMENT_CLOSE_TAG !== $this->tokens[ $previous_comment ]['code'] ) {
				$this->phpcsFile->addError(
					'Hooks must include a docblock with /** formatting */',
					$stack_ptr,
					'NoDocblockFound'
				);
			//	return; Do we need to return here? Can we keep going?
			}
return; //stuff below this isn't ready. We probably need to create an interator class that walks the docblock comment looking for particular things.

				if ( \T_DOC_COMMENT_CLOSE_TAG === $this->tokens[ $previous_comment ]['code'] ) {
					$db_start = $this->phpcsFile->findPrevious( \T_DOC_COMMENT_OPEN_TAG, ( $previous_comment - 1 ) );
					$db_text  = $this->phpcsFile->findNext( \T_DOC_COMMENT_STRING, ( $db_start + 1 ), $previous_comment );

					if ( 0 === strpos( $db_text, '@since') ) {

					}


						$this->phpcsFile->addWarning(
							 'example: ' . $this->tokens[ $db_first_text ]['content'],
							 $stack_ptr,
							'NoSinceParam'
						);
						return;
				}
		}
	}
}
