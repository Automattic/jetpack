<?php
/**
 * "Create with voice" Block.
 *
 * @since 12.5
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Create_With_Voice;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'create-with-voice';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers our block for use in Gutenberg
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
 * "Create with voice" block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the "Create with voice" block attributes.
 * @param string $content String containing the "Create with voice" block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Blocks::classes( FEATURE_NAME, $attr ) ),
		$content
	);
}
