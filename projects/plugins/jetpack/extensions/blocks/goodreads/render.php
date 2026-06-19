<?php
/**
 * Goodreads block render implementation.
 *
 * Loaded lazily from goodreads.php only when the block is rendered, to keep
 * the render body out of the eager front-end PHP/opcache footprint.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Goodreads;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Dynamic rendering of the block.
 *
 * @param array $attr    Array containing the Goodreads block attributes.
 *
 * @return string
 */
function render_implementation( $attr ) {
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	if ( isset( $attr['id'] ) ) {
		if ( isset( $attr['link'] ) ) {
			wp_enqueue_script(
				'jetpack-goodreads-' . esc_attr( $attr['id'] ),
				esc_url_raw( $attr['link'] ),
				array(),
				JETPACK__VERSION,
				true
			);
		}

		$id = esc_attr( $attr['id'] );
	} else {
		$id = '';
	}

	$classes = esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) );

	return sprintf(
		'<div id="%1$s" class="%2$s"></div>',
		$id,
		$classes
	);
}
