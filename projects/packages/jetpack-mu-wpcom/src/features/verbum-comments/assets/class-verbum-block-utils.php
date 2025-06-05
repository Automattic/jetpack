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

		// The block attributes come slashed and `parse_blocks` won't be able to parse them.
		$content = wp_unslash( $content );
		$blocks  = parse_blocks( $content );

		$filtered_blocks = self::filter_blocks_recursive( $blocks );

		// Convert the filtered blocks back to string
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

			$block['innerHTML'] ??= '';
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
