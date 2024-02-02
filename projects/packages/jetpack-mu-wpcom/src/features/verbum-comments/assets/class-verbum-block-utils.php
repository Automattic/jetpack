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
	 * Remove blocks that aren't allowed
	 *
	 * @param string $content - Text of the comment.
	 * @return string
	 */
	public static function remove_blocks( $content ) {
		if ( ! has_blocks( $content ) ) {
			return $content;
		}

		$allowed_blocks = self::get_allowed_blocks();
		// The block attributes come slashed and `parse_blocks` won't be able to parse them.
		$content = wp_unslash( $content );
		$blocks  = parse_blocks( $content );
		$output  = '';

		foreach ( $blocks as $block ) {
			if ( in_array( $block['blockName'], $allowed_blocks, true ) ) {
				$output .= serialize_block( $block );
			}
		}

		return ltrim( $output );
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

		foreach ( array_keys( $allowedtags ) as $tag ) {
			if ( isset( $convert[ $tag ] ) ) {
				$allowed_blocks[] = $convert[ $tag ];
			}
		}

		return $allowed_blocks;
	}
}
