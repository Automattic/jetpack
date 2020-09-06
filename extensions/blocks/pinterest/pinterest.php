<?php
/**
 * Pinterest Block.
 *
 * @since 8.0.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Pinterest;

use Jetpack_AMP_Support;

const FEATURE_NAME = 'pinterest';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Pinterest block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Pinterest block attributes.
 * @param string $content String containing the Pinterest block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	if ( Jetpack_AMP_Support::is_amp_request() ) {
		$width  = 450;
		$height = 750;
		return sprintf(
			'<div class="wp-block-jetpack-pinterest"><amp-pinterest data-do="embedPin" data-url="%s" width="%d" height="%d"></amp-pinterest></div>',
			esc_url( $attr['url'] ),
			esc_attr( $width ),
			esc_attr( $height )
		);
	} else {
		wp_enqueue_script( 'pinterest-pinit', 'https://assets.pinterest.com/js/pinit.js', array(), JETPACK__VERSION, true );
		return $content;
	}
}
