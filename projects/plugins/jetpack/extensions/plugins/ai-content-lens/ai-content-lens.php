<?php
/**
 * Block Editor - AI Assistant plugin feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Content_Lens;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Required directly rather than relying on the plugin bootstrap: on
// WordPress.com Simple the extension files load through wpcom's own loader
// and load-jetpack.php never runs.
require_once __DIR__ . '/../../../_inc/lib/class-jetpack-ai-settings.php';

// Feature name.
const FEATURE_NAME = 'ai-content-lens';

/**
 * Register the AI Content Lens plugin.
 * The feature is only available on sites
 * with a working connection to WordPress.com.
 *
 * @return void
 */
function register_plugin() {
	// Connection check, plus the AI master switch and the writing toggle that
	// owns the excerpt generator on the AI settings page.
	if (
		(
			( new Host() )->is_wpcom_simple()
			|| ( ( new Connection_Manager( 'jetpack' ) )->has_connected_owner() && ! ( new Status() )->is_offline_mode() )
		)
		&& \Jetpack_AI_Settings::is_ai_enabled()
		&& \Jetpack_AI_Settings::is_feature_enabled( 'writing_assistant' )
	) {
		// Register AI Content lens plugin.
		\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
	}
}
add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\register_plugin' );

// Populate the available extensions with ai-content-lens.
add_filter(
	'jetpack_set_available_extensions',
	function ( $extensions ) {
		return array_merge(
			(array) $extensions,
			array(
				FEATURE_NAME,
			)
		);
	}
);
