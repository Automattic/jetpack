<?php
/**
 * Subscriptions Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Subscriptions;

use Automattic\Jetpack\Blocks;
use Jetpack;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'subscriptions';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if (
		( defined( 'IS_WPCOM' ) && IS_WPCOM )
		|| ( Jetpack::is_active() && Jetpack::is_module_active( 'subscriptions' ) )
	) {
		Blocks::jetpack_register_block(
			BLOCK_NAME,
			array( 'render_callback' => __NAMESPACE__ . '\render_block' )
		);
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Subscriptions block render callback.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $content    String containing the block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {
	Jetpack_Gutenberg::load_styles_as_required( FEATURE_NAME );

	return $content;
}
