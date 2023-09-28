<?php
/**
 * Goodreads Block.
 *
 * @since 1.0.0 // Replace with the correct version number.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Goodreads;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'goodreads';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg.
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Goodreads block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Goodreads block attributes.
 * @param string $content String containing the Goodreads block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	$classes = Blocks::classes( FEATURE_NAME, $attr );

	if ( isset( $attr['link'] ) ) {
		wp_enqueue_script( 'goodreads-block', $attr['link'], array(), JETPACK__VERSION, true );
	}

	return sprintf(
		'<div id="%1$s" class="%2$s"></div>',
		esc_attr( $attr['id'] ),
		esc_attr( $classes )
	);
}
