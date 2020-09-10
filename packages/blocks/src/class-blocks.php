<?php
/** Blocks package.
 *
 * @since 9.0.0
 *
 * This package lifts elements from Jetpack's Jetpack_Gutenberg class.
 * It is now an standalone package reusable outside Jetpack.
 *
 * @package automattic/jetpack-blocks
 */

namespace Automattic\Jetpack;

/**
 * Register and manage blocks within a plugin. Used to manage block registration, enqueues, and more.
 *
 * @since 9.0.0
 */
class Blocks {
	/**
	 * Get CSS classes for a block.
	 *
	 * @since 9.0.0
	 *
	 * @param string $slug  Block slug.
	 * @param array  $attr  Block attributes.
	 * @param array  $extra Potential extra classes you may want to provide.
	 *
	 * @return string $classes List of CSS classes for a block.
	 */
	public static function classes( $slug = '', $attr, $extra = array() ) {
		if ( empty( $slug ) ) {
			return '';
		}

		// Basic block name class.
		$classes = array(
			'wp-block-jetpack-' . $slug,
		);

		// Add alignment if provided.
		if (
			! empty( $attr['align'] )
			&& in_array( $attr['align'], array( 'left', 'center', 'right', 'wide', 'full' ), true )
		) {
			array_push( $classes, 'align' . $attr['align'] );
		}

		// Add custom classes if provided in the block editor.
		if ( ! empty( $attr['className'] ) ) {
			array_push( $classes, $attr['className'] );
		}

		// Add any extra classes.
		if ( is_array( $extra ) && ! empty( $extra ) ) {
			$classes = array_merge( $classes, array_filter( $extra ) );
		}

		return implode( ' ', $classes );
	}
}


