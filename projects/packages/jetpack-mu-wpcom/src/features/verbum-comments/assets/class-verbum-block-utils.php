<?php
/**
 * Verbum Block Utils
 *
 * @package automattic/jetpack-mu-plugins
 */

/**
 * Verbum_Block_Utils offer utility functions for sanitizing and parsing blocks.
 */
class Verbum_Block_Utils {
	/**
	 * Remove blocks that aren't allowed using hybrid Block_Scanner optimization
	 *
	 * Uses Block_Scanner for fast pre-filtering when possible, falling back to
	 * parse_blocks approach only when disallowed blocks are detected.
	 *
	 * @param string $content - Text of the comment.
	 * @return string
	 */
	public static function remove_blocks( $content ) {
		if ( ! has_blocks( $content ) ) {
			return $content;
		}

		if ( ! self::has_disallowed_blocks( $content ) ) {
			return $content;
		}

		// Unslash for parse_blocks: slashed JSON attributes can't be parsed.
		// Re-slash after: pre_comment_content filters must return slashed data.
		return wp_slash( self::remove_blocks_with_parse_blocks( wp_unslash( $content ) ) );
	}

	/**
	 * Quick verification using Block_Scanner to detect if content contains disallowed blocks
	 *
	 * This method provides significant performance benefits by avoiding expensive
	 * parse_blocks() processing when all blocks are allowed (the common case).
	 *
	 * @param string $content Content to scan (may be slashed).
	 * @return bool True if disallowed blocks found, false if all blocks are allowed.
	 */
	private static function has_disallowed_blocks( $content ) {
		if ( ! class_exists( '\\Automattic\\Block_Scanner' ) ) {
			return true;
		}

		try {
			$scanner        = \Automattic\Block_Scanner::create( $content );
			$allowed_blocks = self::get_allowed_blocks();

			while ( $scanner->next_delimiter() ) {
				if ( $scanner->opens_block() ) {
					$block_type = $scanner->get_block_type();
					if ( ! in_array( $block_type, $allowed_blocks, true ) ) {
						return true; // Found disallowed block
					}
				}
			}

			return false; // All blocks are allowed
		} catch ( \Exception $e ) {
			return true;
		}
	}

	/**
	 * Remove disallowed blocks using parse_blocks
	 *
	 * @param string $unslashed_content Content with blocks (already unslashed).
	 * @return string Filtered content with disallowed blocks removed.
	 */
	private static function remove_blocks_with_parse_blocks( $unslashed_content ) {
		$blocks          = parse_blocks( $unslashed_content );
		$filtered_blocks = self::filter_blocks_recursive( $blocks );
		return serialize_blocks( $filtered_blocks );
	}

	/**
	 * Recursively filter blocks and their inner blocks
	 *
	 * @param array $blocks Array of blocks to filter.
	 * @return array Filtered blocks.
	 */
	private static function filter_blocks_recursive( $blocks ) {
		$allowed_blocks = self::get_allowed_blocks();
		$filtered       = array();

		foreach ( $blocks as $block ) {
			if ( ! in_array( $block['blockName'], $allowed_blocks, true ) ) {
				continue;
			}

			if ( ! empty( $block['innerBlocks'] ) ) {
				$block['innerBlocks'] = self::filter_blocks_recursive( $block['innerBlocks'] );

				// Reconstruct innerContent to match filtered innerBlocks
				$inner_content = array();
				$block_index   = 0;
				foreach ( $block['innerContent'] as $chunk ) {
					if ( is_string( $chunk ) ) {
						$inner_content[] = $chunk;
					} elseif ( isset( $block['innerBlocks'][ $block_index ] ) ) {
						$inner_content[] = null;
						++$block_index;
					}
				}
				$block['innerContent'] = $inner_content;
			}

			$block['innerHTML'] = isset( $block['innerHTML'] ) && is_string( $block['innerHTML'] ) ? $block['innerHTML'] : '';

			if ( empty( $block['innerContent'] ) ) {
				$block['innerContent'] = array( $block['innerHTML'] );
			}

			$filtered[] = $block;
		}

		return $filtered;
	}

	/**
	 * Filter blocks from content according to our allowed blocks
	 *
	 * @param string $content - The content to be processed.
	 * @return array
	 */
	private static function filter_blocks( $content ) {
		$registry       = new WP_Block_Type_Registry();
		$allowed_blocks = self::get_allowed_blocks();

		foreach ( $allowed_blocks as $allowed_block ) {
			$registry->register( $allowed_block );
		}

		$filtered_blocks = array();
		$blocks          = parse_blocks( $content );

		foreach ( $blocks as $block ) {
			$filtered_blocks[] = new WP_Block( $block, array(), $registry );
		}

		return $filtered_blocks;
	}

	/**
	 * Render blocks in the comment content
	 * Filters blocks that aren't allowed
	 *
	 * @param string $comment_content - Text of the comment.
	 * @return string
	 */
	public static function render_verbum_blocks( $comment_content ) {
		if ( ! has_blocks( $comment_content ) ) {
			return $comment_content;
		}

		$blocks          = self::filter_blocks( $comment_content );
		$comment_content = '';

		foreach ( $blocks as $block ) {
			$comment_content .= $block->render();
		}

		return $comment_content;
	}

	/**
	 * Get a list of allowed blocks by looking at the allowed comment tags
	 *
	 * @return string[]
	 */
	public static function get_allowed_blocks() {
		global $allowedtags;

		// Validate $allowedtags integrity - use local variable to avoid override warning
		$validated_allowedtags = $allowedtags;
		if ( ! is_array( $validated_allowedtags ) ) {
			$validated_allowedtags = wp_kses_allowed_html( 'post' );
		}

		$allowed_blocks = array( 'core/paragraph', 'core/list', 'core/code', 'core/list-item', 'core/quote', 'core/image', 'core/embed' );
		$convert        = array(
			'blockquote' => 'core/quote',
			'h1'         => 'core/heading',
			'h2'         => 'core/heading',
			'h3'         => 'core/heading',
			'img'        => 'core/image',
			'ul'         => 'core/list',
			'ol'         => 'core/list',
			'pre'        => 'core/code',
		);

		foreach ( array_keys( $validated_allowedtags ) as $tag ) {
			if ( isset( $convert[ $tag ] ) ) {
				$allowed_blocks[] = $convert[ $tag ];
			}
		}

		return $allowed_blocks;
	}

	/**
	 * Check if we should show the Verbum comments.
	 *
	 * This is used to determine if the Verbum comments should be shown on the current page.
	 *
	 * @return bool
	 */
	public static function should_show_verbum_comments() {
		return (
			( is_singular() && comments_open() )
			|| ( is_front_page() && is_page() && comments_open() )
		);
	}
}
