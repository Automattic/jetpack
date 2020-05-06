<?php
/**
 * This sniff verifies a WordPress hook function has a preceding docblock.
 *
 * @package   automattic/jetpack-coding-standards
 */

namespace Automattic\Jetpack\CodingStandards\Sniffs\InlineDocs;

use WordPressCS\WordPress\AbstractFunctionRestrictionsSniff;
use PHP_CodeSniffer\Util\Tokens;

/**
 * Class HooksMustHaveDocblockSniff
 *
 * @package Automattic\Jetpack\CodingStandards\Sniffs\InlineDocs
 */
class HooksMustHaveDocblockSniff extends AbstractFunctionRestrictionsSniff {

	/**
	 * Array of WordPress hook execution functions.
	 *
	 * @var array WordPress hook execution function name => filter or action.
	 */
	protected $hook_functions = array(
		'apply_filters'            => 'filter',
		'apply_filters_ref_array'  => 'filter',
		'apply_filters_deprecated' => 'filter',
		'do_action'                => 'action',
		'do_action_ref_array'      => 'action',
		'do_action_deprecated'     => 'action',
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

		$previous_comment = $this->phpcsFile->findPrevious( Tokens::$commentTokens, ( $stack_ptr - 1 ) );

		if ( false !== $previous_comment ) {
			/*
			 * Check to determine if there is a comment immediately preceding the function call.
			 */
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
				// return; Do we need to return here? Can we keep going?
			}

			/*
			 * Process docblock tags.
			 */
			$comment_end   = $previous_comment;
			$comment_start = ( isset( $this->tokens[ $comment_end ]['comment_opener'] ) ) ? $this->tokens[ $comment_end ]['comment_opener'] : false;
			$has           = array(
				'module' => false,
				'since'  => false,
			);

			// The comment isn't a docblock, so we're going to stop here.
			if ( ! $comment_start ) {
				return;
			}

			$string = $this->phpcsFile->findNext( T_DOC_COMMENT_STRING, $comment_start, $comment_end );
			// If the call is documented elsewhere, stop here.
			if ( 0 === strpos( $this->tokens[ $string ]['content'], 'This filter is documented in' ) ) {
				return;
			}

			foreach ( $this->tokens[ $comment_start ]['comment_tags'] as $tag ) {
				// Is the next tag of the docblock the "@module" tag?
				if ( '@module' === $this->tokens[ $tag ]['content'] ) {
					// This is used later to determine if we need to throw an error for no module tag.
					$has['module'] = true;

					// Find the next string, which will be the text after the @module.
					$string = $this->phpcsFile->findNext( T_DOC_COMMENT_STRING, $tag, $comment_end );
					// If it is false, there is no text or if the text is on the another line, error.
					if ( false === $string || $this->tokens[ $string ]['line'] !== $this->tokens[ $tag ]['line'] ) {
						$this->phpcsFile->addError( 'Module tag must have a value.', $tag, 'EmptyModule' );
					}
				}

				if ( '@since' === $this->tokens[ $tag ]['content'] ) {
					$has['since'] = true;
					$string       = $this->phpcsFile->findNext( T_DOC_COMMENT_STRING, $tag, $comment_end );
					if ( false === $string || $this->tokens[ $string ]['line'] !== $this->tokens[ $tag ]['line'] ) {
						$this->phpcsFile->addError( 'Since tag must have a value.', $tag, 'EmptySince' );
					} elseif ( ! preg_match( '\'/^\d+\.\d+\.\d+/\'', $string ) ) { // Requires X.Y.Z. Trailing 0 is needed for a major release.
						$this->phpcsFile->addError( 'Since tag must have a X.Y.Z. version number.', $tag, 'InvalidSince' );
					}
				}
			}

			foreach ( $has as $name => $present ) {
				if ( ! $present ) {
					$this->phpcsFile->addError( 'Hook documentation is missing a tag: ' . $name, $comment_start, 'No' . ucfirst( $name ) );
				}
			}
		}
	}
}
