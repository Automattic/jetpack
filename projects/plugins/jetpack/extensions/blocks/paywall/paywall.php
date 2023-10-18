<?php
/**
 * Paywall Block.
 *
 * @since 12.5
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Paywall;

use Automattic\Jetpack\Blocks;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if ( ! \Jetpack::is_module_active( 'subscriptions' ) ) {
		return;
	}
	if ( ! class_exists( '\Jetpack_Memberships' ) ) {
		return;
	}

	Blocks::jetpack_register_block(
		__DIR__,
		array(
			'render_callback' => __NAMESPACE__ . '\render_block',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Paywall block render callback.
 *
 * @return string
 */
function render_block() {
	if ( doing_filter( 'get_the_excerpt' ) ) {
		if ( \Jetpack_Memberships::user_can_view_post() ) {
			return '';
		}
		return '[[[[[' . Blocks::get_block_name( __DIR__ ) . ']]]]]';
	}
	return '';
}

/**
 * Adds the Paywall block to excerpt allowed blocks.
 *
 * @param array $allowed_blocks The allowed blocks.
 *
 * @return array The allowed blocks.
 */
function excerpt_allowed_blocks( $allowed_blocks ) {
	return array_merge( $allowed_blocks, array( Blocks::get_block_name( __DIR__ ) ) );
}
add_filter( 'excerpt_allowed_blocks', __NAMESPACE__ . '\excerpt_allowed_blocks' );
