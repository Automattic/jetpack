<?php
/**
 * This sniff verifies a Jetpack hook function has a preceding docblock with Jetpack-specific tags.
 *
 * @package   automattic/jetpack-coding-standards
 */

namespace Automattic\Jetpack\CodingStandards\Jetpack\Sniffs\Commenting;

use Automattic\Jetpack\CodingStandards\Jetpack\Sniffs\Commenting\HooksInlineDocsSniff as HooksInlineDocsSniff;

/**
 * Class JetpackHooksRequirementsSniff
 *
 * Custom hook docblock requirements for Jetpack.
 *
 * @package Automattic\Jetpack\CodingStandards\Sniffs\Commenting
 */
class HooksRequireTagsSniff extends HooksInlineDocsSniff {

	/**
	 * @var array Required tags.
	 */
	public $required_tags = array();

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
		if ( ! $this->verify_valid_match( $stack_ptr ) ) {
			return;
		}

		$previous_comment = $this->return_previous_comment( $stack_ptr );

		// If no previous comment or no specified required tags, abort.
		if ( ! $previous_comment || ! $this->required_tags ) {
			return;
		}

		/*
	     * Process docblock tags.
		 */
		$comment_end   = $previous_comment;
		$comment_start = $this->return_comment_start( $comment_end );

		$has = array();
		foreach ( $this->required_tags as $required_tag ) {
			$has[ $required_tag ] = false;
		}

		// The comment isn't a docblock or is documented elsewhere, so we're going to stop here.
		if ( ! $comment_start || $this->is_previously_documented( $comment_start, $comment_end ) ) {
			return;
		}

		foreach ( $this->tokens[ $comment_start ]['comment_tags'] as $tag ) {
			foreach ( $this->required_tags as $required_tag ) {
				if ( '@' . $required_tag === $this->tokens[ $tag ]['content'] ) {
					// This is used later to determine if we need to throw an error for no module tag.
					$has[ $required_tag ] = true;

					// Find the next string, which will be the text after the @module.
					$string = $this->phpcsFile->findNext( T_DOC_COMMENT_STRING, $tag, $comment_end );
					// If it is false, there is no text or if the text is on the another line, error.
					if ( false === $string || $this->tokens[ $string ]['line'] !== $this->tokens[ $tag ]['line'] ) {
						$this->phpcsFile->addError( ucfirst( $required_tag ) . ' tag must have a value.', $tag, 'Empty' . ucfirst( $required_tag ) );
					}
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
