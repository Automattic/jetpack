<?php
/**
 * Block Editor - AI Assistant plugin feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\AiAssistantPlugin;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

// Feature name.
const FEATURE_NAME = 'ai-assistant-plugin';

/**
 * Register the AI assistant plugin.
 * The feature is only available on sites
 * with a working connection to WordPress.com.
 *
 * @return void
 */
function register_plugin() {
	// Check Jetpack AI feature availability.
	if (
		(
			new Host() )->is_wpcom_simple()
			|| ( ( new Connection_Manager( 'jetpack' ) )->has_connected_owner() && ! ( new Status() )->is_offline_mode()
		)
		&& apply_filters( 'jetpack_ai_enabled', true )
	) {
		// Register AI assistant plugin.
		\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
	}
}
add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\register_plugin' );

// Initialize the AI sidebar (Agents Manager CDN loader + provider registration).
require_once __DIR__ . '/ai-sidebar/class-jetpack-ai-sidebar.php';
Jetpack_AI_Sidebar::init();

// Initialize Reader Chat. Must run in both admin and frontend contexts
// (admin: register_setting exposes the toggle via /wp/v2/settings;
// frontend: wp_enqueue_scripts mounts the widget on reader pages).
// Loading here ensures it runs whenever ai-assistant-plugin does, which
// is both on block-editor requests and regular admin pages — a strict
// superset of the Blocks-module-gated path that modules/blocks.php
// previously used.
require_once __DIR__ . '/reader-chat/class-jetpack-reader-chat.php';
Jetpack_Reader_Chat::init();

/**
 * Register the `jetpack_ai_agents_enabled` site option so it can be read
 * and written through the /wp/v2/settings REST endpoint.
 *
 * Backs the AI Agent Access toggle in the Jetpack Search dashboard, which
 * lets site owners opt in to letting AI assistants (Claude, ChatGPT, etc.)
 * answer reader questions using their blog's content. Registered
 * unconditionally so the public-facing toggle is always available; access
 * is still capability-gated by /wp/v2/settings (manage_options).
 *
 * @since $$next-version$$
 *
 * @return void
 */
function register_ai_agents_setting() {
	register_setting(
		'general',
		'jetpack_ai_agents_enabled',
		array(
			'type'              => 'boolean',
			'description'       => __( 'Whether AI Agent Access is enabled on this site.', 'jetpack' ),
			'sanitize_callback' => 'rest_sanitize_boolean',
			'show_in_rest'      => true,
			'default'           => false,
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_ai_agents_setting' );

// Populate the available extensions with ai-assistant-plugin.
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
