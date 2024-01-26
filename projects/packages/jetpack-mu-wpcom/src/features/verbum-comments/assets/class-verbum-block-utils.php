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
	 * Helper function to filter blocks that are not allowed recursively.
	 *
	 * @param array[] $blocks the blocks to be filtered.
	 * @return array[] the filtered blocks.
	 */
	private static function filter_blocks_recursive( $blocks ) {
		$filtered_blocks = array();

		$allowed_blocks = self::get_allowed_blocks();
		foreach ( $blocks as $block ) {
			if ( in_array( $block['blockName'], $allowed_blocks, true ) ) {
				$filtered_block = $block;

				// Filter possible NULL values from innerContent to avoid parsing issues
				if ( isset( $block['innerContent'] ) && is_array( $block['innerContent'] ) ) {
					$filtered_block['innerContent'] = array_filter(
						$filtered_block['innerContent'],
						function ( $value ) {
							return $value !== null;
						}
					);
				}

				// Recursively apply the filtering to innerBlocks
				if ( isset( $block['innerBlocks'] ) && is_array( $block['innerBlocks'] ) ) {
					$filtered_block['innerBlocks'] = self::filter_blocks_recursive( $block['innerBlocks'] );
				}

				$filtered_blocks[] = $filtered_block;
			}
		}
		return $filtered_blocks;
	}

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

		// The block attributes come slashed and `parse_blocks` won't be able to parse them.
		$content         = wp_unslash( $content );
		$blocks          = parse_blocks( $content );
		$filtered_blocks = self::filter_blocks_recursive( $blocks );

		$output = '';

		foreach ( $filtered_blocks as $block ) {
			$output .= serialize_block( $block );
		}

		return ltrim( $output );
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

		$blocks          = parse_blocks( $comment_content );
		$filtered_blocks = self::filter_blocks_recursive( $blocks );

		$comment_content = '';

		foreach ( $filtered_blocks as $block ) {
			$comment_content .= render_block( $block );
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
