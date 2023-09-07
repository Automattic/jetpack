<?php
/**
 * Jetpack AI Chat.
 *
 * @since 12.1
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\AIChat;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

/**
 * Registers our block for use in Gutenberg
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
 * Jetpack AI Paragraph block registration/dependency declaration.
 *
 * @param array $attr Array containing the Jetpack AI Chat block attributes.
 *
 * @return string
 */
function load_assets( $attr ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	return sprintf(
		'<div class="%1$s" id="jetpack-ai-chat"></div>',
		esc_attr( Blocks::classes( FEATURE_NAME, $attr ) )
	);
}
