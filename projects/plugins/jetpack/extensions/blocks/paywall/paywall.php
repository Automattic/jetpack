<?php
/**
 * Paywall Block.
 *
 * @since 12.1
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Paywall;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'paywall';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
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
 * Paywall block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Paywall block attributes.
 * @param string $content String containing the Paywall block content.
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
