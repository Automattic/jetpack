<?php
/**
 * Block Editor - Agenttic plugin integration.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Agenttic;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

// Feature name.
const FEATURE_NAME = 'agenttic';

/**
 * Register the Agenttic sidebar plugin when Jetpack AI features are available.
 */
function register_plugin() {
	if (
		(
			new Host() )->is_wpcom_simple()
			|| ( ( new Connection_Manager( 'jetpack' ) )->has_connected_owner() && ! ( new Status() )->is_offline_mode()
		)
		&& apply_filters( 'jetpack_ai_enabled', true )
	) {
		\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
	}
}
add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\\register_plugin' );

// Populate the available extensions with the Agenttic plugin.
add_filter(
	'jetpack_set_available_extensions',
	function ( $extensions ) {
		return array_merge(
			(array) $extensions,
			array( FEATURE_NAME )
		);
	}
);
