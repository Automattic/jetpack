<?php
/**
 * WordPress.com's answers to the Agents Manager loader's filters.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Feature_Flags;
use Automattic\Jetpack\Status\Host;

/**
 * Enable the Agents Manager in the block editor when the WordPress Agent is on.
 *
 * Preserves an existing true so other integrations (such as the Jetpack AI
 * Sidebar) can request the shell independently.
 *
 * @param mixed $enabled Whether an earlier filter already enabled it.
 * @return bool
 */
function wpcom_agents_manager_enable_in_block_editor( $enabled ): bool {
	return (bool) $enabled || wpcom_is_wordpress_agent_enabled();
}
add_filter( 'agents_manager_enabled_in_block_editor', 'wpcom_agents_manager_enable_in_block_editor' );

/**
 * Whether the current request comes from an Automattician on the A8C proxy.
 *
 * @return bool
 */
function wpcom_agents_manager_is_proxied_automattician(): bool {
	// is_a11n() already requires the proxy on Atomic, but not on Simple.
	$is_simple = ( new Host() )->is_wpcom_simple();
	if ( $is_simple && ! ( function_exists( 'wpcom_is_proxied_request' ) && wpcom_is_proxied_request() ) ) {
		return false;
	}

	return Wpcom_Feature_Flags::is_a11n();
}

/**
 * Load the Agents Manager on wp-admin screens for proxied Automatticians.
 *
 * Editors are left to their existing gates, including the WordPress Agent option.
 *
 * @param mixed $should_load Whether an earlier integration already requested it.
 * @return bool
 */
function wpcom_agents_manager_should_load_for_proxied_automattician( $should_load ): bool {
	if ( $should_load ) {
		return true;
	}

	// Iframed screens (media-upload.php, update.php) would boot a second copy of the app.
	if ( ! is_admin() || Constants::is_true( 'IFRAME_REQUEST' ) ) {
		return false;
	}

	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( $screen && ( $screen->is_block_editor() || 'post' === $screen->base ) ) {
		return false;
	}

	if ( ! wpcom_agents_manager_is_proxied_automattician() ) {
		return false;
	}

	add_filter( 'jetpack_ai_sidebar_agents_manager_data', 'wpcom_agents_manager_mark_internal_only' );
	return true;
}
// After the other integrations, so an earlier true means one of them loaded the chat.
add_filter( 'agents_manager_should_load', 'wpcom_agents_manager_should_load_for_proxied_automattician', 20 );

/**
 * Show the chat's "A8C Only" label, since only Automatticians get it here.
 *
 * @param array $data Data encoded into `agentsManagerData`.
 * @return array
 */
function wpcom_agents_manager_mark_internal_only( $data ) {
	$data['isInternalOnly'] = true;
	return $data;
}
