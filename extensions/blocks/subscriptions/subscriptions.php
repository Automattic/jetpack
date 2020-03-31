<?php
/**
 * Subscriptions Block.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Subscriptions;

use Jetpack_Gutenberg;

const FEATURE_NAME = 'subscriptions';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block( BLOCK_NAME );

	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );
}
add_action( 'init', __NAMESPACE__ . '\register_block' );
