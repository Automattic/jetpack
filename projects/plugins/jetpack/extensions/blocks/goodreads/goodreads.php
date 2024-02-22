<?php
/**
 * Goodreads Block.
 *
 * @since 13.2
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Goodreads;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

/**
 * Registers the block for use in Gutenberg.
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Goodreads block registration/dependency declaration.
 *
 * @param array $attr    Array containing the Goodreads block attributes.
 *
 * @return string
 */
function load_assets( $attr ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	if ( isset( $attr['link'] ) ) {
		wp_enqueue_script( 'goodreads-block', $attr['link'], array(), JETPACK__VERSION, true );
	}

	return sprintf(
		'<div id="%1$s" class="%2$s"></div>',
		esc_attr( $attr['id'] ),
		esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) )
	);
}
