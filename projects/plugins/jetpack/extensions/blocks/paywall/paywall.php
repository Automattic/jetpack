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

const FEATURE_NAME = 'paywall';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

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
		BLOCK_NAME
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );
