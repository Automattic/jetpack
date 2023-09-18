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
	global $publicize;

	// Capability check.
	if (
		! $publicize
		|| ! $publicize->current_user_can_access_publicize_data()
	) {
		Jetpack_Gutenberg::set_extension_unavailable( 'jetpack/publicize', 'unauthorized' );
		return;
	}

	// Connection check.
	if (
		( new Host() )->is_wpcom_simple()
		|| ( ( new Connection_Manager( 'jetpack' ) )->has_connected_owner() && ! ( new Status() )->is_offline_mode() )
	) {
		// Register Publicize.
		Jetpack_Gutenberg::set_extension_available( 'jetpack/publicize' );

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
