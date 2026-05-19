<?php
/**
 * Block Editor - AI Assistant plugin feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\AiAssistantPlugin;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
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
 * Register the `jetpack_ai_agents_enabled` site option.
 *
 * Backs the AI Agent Access toggle in the Jetpack Search dashboard, which
 * lets site owners opt in to AI assistants answering reader questions using
 * their blog's content.
 *
 * @since 15.9
 *
 * @return void
 */
function register_ai_agents_setting() {
	if ( ! is_proxied_request() ) {
		return;
	}

	$show_in_rest = ! ( new Host() )->is_wpcom_simple();

	register_setting(
		'general',
		'jetpack_ai_agents_enabled',
		array(
			'type'              => 'boolean',
			'description'       => __( 'Whether AI Agent Access is enabled on this site.', 'jetpack' ),
			'sanitize_callback' => 'rest_sanitize_boolean',
			'show_in_rest'      => $show_in_rest,
			'default'           => false,
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_ai_agents_setting' );

/**
 * Check whether the current request is coming from an Automattic rollout context.
 *
 * This gates the AI Agent Access toggle during rollout so regular site owners,
 * and non-proxied staff, do not see unfinished controls.
 *
 * IMPORTANT: Only use for feature gating, not for authorization.
 *
 * @since 15.9
 *
 * @return bool
 */
function is_proxied_request(): bool {
	return is_automattic_proxied_request();
}

/**
 * Check whether the current request is coming from a proxied Automattic context.
 *
 * Keep this check local to the rollout gate so WPCOM environments with older
 * vendored Jetpack packages do not fatal during bootstrap.
 *
 * @since 15.9
 *
 * @return bool
 */
function is_automattic_proxied_request(): bool {
	if ( function_exists( 'wpcom_is_proxied_request' ) && \wpcom_is_proxied_request() ) {
		return true;
	}

	if (
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- boolean check only.
		( isset( $_SERVER['A8C_PROXIED_REQUEST'] ) && (bool) sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) ) ) ||
		Constants::is_true( 'A8C_PROXIED_REQUEST' )
	) {
		return true;
	}

	if ( Constants::is_true( 'AT_PROXIED_REQUEST' ) && Constants::is_defined( 'ATOMIC_CLIENT_ID' ) ) {
		switch ( (int) Constants::get_constant( 'ATOMIC_CLIENT_ID' ) ) {
			case 1:
			case 2:
			case 3: // Pressable.
			case 32:
			case 118: // Commerce garden client (ciab).
				return true;
		}
	}

	return false;
}

/**
 * Add the AI Agent Access setting to Jetpack Sync's option whitelist.
 *
 * Atomic and self-hosted Jetpack sites write `jetpack_ai_agents_enabled`
 * locally via /wp/v2/settings. Syncing the option keeps connected sites and
 * the WP.com-hosted ability permission gate aligned.
 *
 * @since 15.9
 *
 * @param array $options Option names allowed to sync.
 * @return array Updated option names.
 */
function add_ai_agents_sync_options_whitelist( array $options ): array {
	$options[] = 'jetpack_ai_agents_enabled';
	return array_values( array_unique( $options ) );
}
add_filter( 'jetpack_sync_options_whitelist', __NAMESPACE__ . '\add_ai_agents_sync_options_whitelist' );

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
