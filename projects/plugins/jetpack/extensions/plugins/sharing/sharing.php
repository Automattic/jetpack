<?php
/**
 * Block Editor - Sharing feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Sharing;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Jetpack_Gutenberg;

/**
 * Register Sharing plugin.
 *
 * @return void
 */
function register_plugins() {
	// Connection check.
	if (
		( new Host() )->is_wpcom_simple()
		|| ( ( new Connection_Manager( 'jetpack' ) )->has_connected_owner() && ! ( new Status() )->is_offline_mode() )
	) {
		// Register Publicize.
		Jetpack_Gutenberg::set_extension_available( 'sharing' );

	}
}
add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\register_plugins' );

/**
 * Allow display the Sharing UI in the editor.
 */
add_action(
	'init',
	function () {
		if ( ! \Jetpack::is_module_active( 'sharedaddy' ) ) {
			add_post_type_support( 'post', 'jetpack-sharing-buttons' );
		}
	}
);
