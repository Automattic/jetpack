<?php
/**
 * Block Editor - Publicize and Republicize features.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Publicize;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Jetpack_Gutenberg;

/**
 * Register both Publicize and Republicize plugins.
 *
 * @return void
 */
function register_plugins() {
	/** This filter is documented in projects/packages/publicize/src/class-publicize-base.php */
	$capability = apply_filters( 'jetpack_publicize_capability', 'publish_posts' );

	// Capability check.
	if (
		! current_user_can( $capability )
	) {
		Jetpack_Gutenberg::set_extension_unavailable( 'publicize', 'unauthorized' );
		return;
	}

	// Connection check.
	if (
		( new Host() )->is_wpcom_simple()
		|| ( ( new Connection_Manager( 'jetpack' ) )->has_connected_owner() && ! ( new Status() )->is_offline_mode() )
	) {
		// Register Publicize.
		Jetpack_Gutenberg::set_extension_available( 'publicize' );

		// Set the republicize availability, depending on the site plan.
		Jetpack_Gutenberg::set_availability_for_plan( 'republicize' );
	}
}
add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\register_plugins' );

// Populate the available extensions with republicize.
add_filter(
	'jetpack_set_available_extensions',
	function ( $extensions ) {
		return array_merge(
			$extensions,
			array(
				'republicize',
			)
		);
	}
);

/**
 * Publicize declares its support for the 'post' post type by default.
 * Let's do it here as well, when the module hasn't been activated yet.
 * It helps us display the Publicize UI in the editor.
 */
add_action(
	'init',
	function () {
		if ( ! \Jetpack::is_module_active( 'publicize' ) ) {
			add_post_type_support( 'post', 'publicize' );
		}
	}
);
