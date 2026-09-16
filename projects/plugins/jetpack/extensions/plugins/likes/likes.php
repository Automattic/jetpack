<?php
/**
 * Block Editor - Likes feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Likes;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Jetpack_Gutenberg;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Register Likes plugin.
 *
 * @return void
 */
function register_plugins() {
	/*
	 * The extension is available even when the module is not active,
	 * so we can display a nudge to activate the module instead of the block.
	 * We skip that nudge for non-admins, who cannot activate modules, and on block themes,
	 * where the answer is the Like block in a template rather than the legacy module.
	 */
	if ( ! ( new Modules() )->is_active( 'likes' ) && ( ! current_user_can( 'jetpack_activate_modules' ) || wp_is_block_theme() ) ) {
		return;
	}

	// Register Likes.
	if (
		( new Host() )->is_wpcom_simple()
		|| ( ( new Connection_Manager( 'jetpack' ) )->has_connected_owner() && ! ( new Status() )->is_offline_mode() )
	) {
		Jetpack_Gutenberg::set_extension_available( 'likes' );
	}
}

add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\register_plugins' );

/**
 * Register post types
 */
add_action(
	'rest_api_init',
	function () {
		if ( ! ( new Modules() )->is_active( 'likes' ) ) {
			$post_types = get_post_types( array( 'public' => true ) );
			foreach ( $post_types as $post_type ) {
				add_post_type_support( $post_type, 'jetpack-post-likes' );
			}
		}
	}
);
