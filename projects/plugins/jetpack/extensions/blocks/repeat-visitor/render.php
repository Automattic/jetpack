<?php
/**
 * Repeat Visitor block render implementation.
 *
 * Loaded lazily from repeat-visitor.php only when the block is rendered, to keep
 * the render body out of the eager front-end PHP/opcache footprint.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Repeat_Visitor;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Repeat Visitor block dependency declaration.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $content    String containing the block content.
 *
 * @return string
 */
function render_block_implementation( $attributes, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	$classes = Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attributes );

	$count     = isset( $_COOKIE['jp-visit-counter'] ) ? (int) $_COOKIE['jp-visit-counter'] : 0;
	$criteria  = $attributes['criteria'] ?? 'after-visits';
	$threshold = isset( $attributes['threshold'] ) ? (int) $attributes['threshold'] : 3;

	if (
		( 'after-visits' === $criteria && $count >= $threshold ) ||
		( 'before-visits' === $criteria && $count < $threshold )
	) {
		return $content;
	}

	// return an empty div so that view script increments the visit counter in the cookie.
	return '<div class="' . esc_attr( $classes ) . '"></div>';
}
