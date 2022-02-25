<?php
/**
 * Payments plugin.
 *
 * @since $$next-version$$
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Payments;

use Automattic\Jetpack\Blocks;
use Jetpack;

const FEATURE_NAME = 'payments';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the plugin for use in the block editor's plugin sidebar.
 * This is done via an action so that we can disable registration if we need to.
 */
function register_plugin() {
	if (
		( defined( 'IS_WPCOM' ) && IS_WPCOM )
		|| Jetpack::is_connection_ready()
	) {
		Blocks::jetpack_register_block(
			BLOCK_NAME,
			array(
				'plan_check' => true,
			)
		);
	}
}
add_action( 'init', __NAMESPACE__ . '\register_plugin' );
