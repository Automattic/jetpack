<?php
/**
 * Subscriptions Block
 *
 * @since 8.6.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Subscriptions;

use Jetpack;
use Jetpack_Gutenberg;
use WP_Block_Type_Registry;

const FEATURE_NAME = 'subscriptions';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if (
		(
			( defined( 'IS_WPCOM' ) && IS_WPCOM )
			|| Jetpack::is_module_active( FEATURE_NAME )
		)
		&& (
			class_exists( 'WP_Block_Type_Registry' )
			&& ! WP_Block_Type_Registry::get_instance()->is_registered( BLOCK_NAME )
		)
	) {
		jetpack_register_block( BLOCK_NAME );
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block' );
