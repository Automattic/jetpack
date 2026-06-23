<?php
/**
 * Top Posts Block.
 *
 * @since 13.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Top_Posts;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	/*
	 * The block is available even when the module is not active,
	 * so we can display a nudge to activate the module instead of the block.
	 * However, since non-admins cannot activate modules, we do not display the empty block for them.
	 */
	if ( ! ( new Modules() )->is_active( 'stats' ) && ! current_user_can( 'jetpack_activate_modules' ) ) {
		return;
	}

	if ( ( new Host() )->is_wpcom_simple() || ( new Connection_Manager( 'jetpack' ) )->has_connected_owner() && ! ( new Status() )->is_offline_mode() ) {
		Blocks::jetpack_register_block(
			__DIR__,
			array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
		);
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Top Posts block registration/dependency declaration.
 *
 * The render implementation lives in render.php and is only loaded when the
 * block is actually rendered, keeping it out of the eager front-end path.
 *
 * @param array $attributes Array containing the Top Posts block attributes.
 *
 * @return string
 */
function load_assets( $attributes ) {
	require_once __DIR__ . '/render.php';
	return load_assets_implementation( $attributes );
}
