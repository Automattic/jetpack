<?php
/**
 * Like Block.
 *
 * @since $$next-version$$
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Like;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array(
			'api_version'     => 3,
			'render_callback' => __NAMESPACE__ . '\render_block',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Like block render function.
 *
 * @param array $attr    Array containing the Like block attributes.
 *
 * @return string
 */
function render_block( $attr ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$blog_id = get_current_blog_id();
		$type    = 'wpcom'; // WPCOM simple sites.
	} else {
		$blog_id = \Jetpack_Options::get_option( 'id' );
		$type    = 'jetpack'; // Self-hosted (includes Atomic)
	}

	$output = 'This is where the like button will go.';

	return sprintf(
		'<div class="%1$s" data-blog-id="%2$d" data-blog-type="%3$s">%4$s</div>',
		esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) ),
		esc_attr( $blog_id ),
		esc_attr( $type ),
		$output
	);
}
