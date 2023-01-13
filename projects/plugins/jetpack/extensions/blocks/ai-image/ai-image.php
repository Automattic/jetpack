<?php
/**
 * Jetpack AI Image Block.
 *
 * @since 11.8
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\AIImage;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Status\Host;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'ai-image';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers our block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) || ( new Host() )->is_woa_site() ) {
		Blocks::jetpack_register_block(
			BLOCK_NAME,
			array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
		);
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Jetpack AI image block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Jetpack AI image block attributes.
 * @param string $content String containing the Jetpack AI image block content.
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
		esc_attr( Jetpack_Gutenberg::block_classes( FEATURE_NAME, $attr ) ),
		$content
	);
}
