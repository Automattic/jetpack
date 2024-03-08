<?php
/**
 * "Voice to content" Block.
 *
 * @since 12.5
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Voice_To_Content;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

/**
 * Registers our block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	/**
	 * Register the block only if we are on an A8C P2 site.
	 * TODO: when opening it to Jetpack sites, do the same checks
	 * we do on the AI Assistant block: the jetpack_ai_enabled filter
	 * and the Jetpack connection:
	 * - apply_filters( 'jetpack_ai_enabled', true )
	 * - ( new Host() )->is_wpcom_simple() || ! ( new Status() )->is_offline_mode()
	 */
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		if ( function_exists( 'wpcom_is_automattic_p2_site' ) && wpcom_is_automattic_p2_site() ) {
			Blocks::jetpack_register_block(
				__DIR__,
				array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
			);
		}
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * "Voice to content" block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the "Voice to content" block attributes.
 * @param string $content String containing the "Voice to content" block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) ),
		$content
	);
}
