<?php
/**
 * Block Editor - Likes feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Likes;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Jetpack_Gutenberg;

/**
 * Register Likes plugin.
 *
 * @return void
 */
function register_plugins() {
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
		if ( ! \Jetpack::is_module_active( 'likes' ) ) {
			$post_types = get_post_types( array( 'public' => true ) );
			foreach ( $post_types as $post_type ) {
				add_post_type_support( $post_type, 'jetpack-post-likes' );
			}
		}
	}
);
