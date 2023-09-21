<?php
/**
 * Block Editor - Sharing feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Sharing;

use Jetpack_Gutenberg;

/**
 * Register Sharing plugin.
 *
 * @return void
 */
function register_plugins() {
	// Register Sharing.
	Jetpack_Gutenberg::set_extension_available( 'sharing' );
}

add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\register_plugins' );

/**
 * Allow display the Sharing UI in the editor.
 */
add_action(
	'init',
	function () {
		if ( ! \Jetpack::is_module_active( 'sharedaddy' ) ) {
			$post_types = get_post_types( array( 'public' => true ) );

			foreach ( $post_types as $post_type ) {
				add_post_type_support( $post_type, 'jetpack-sharing-buttons' );
			}
		}
	}
);
