<?php
/**
 * Content Guidelines AI — Jetpack AI integration.
 *
 * Enqueues a standalone JS bundle on the Content Guidelines admin page
 * that adds AI-powered guideline generation via Jetpack.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Status\Visitor;
use Automattic\Jetpack\Tracking;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Check if the current user is an Automattician.
 *
 * - Simple sites: wpcom_is_proxied_request() + is_automattician()
 * - Atomic sites: Visitor::is_automattician_feature_flags_only()
 *
 * @return bool
 */
function jetpack_content_guidelines_ai_is_automattician() {
	// Simple sites.
	if ( function_exists( 'wpcom_is_proxied_request' )
		&& wpcom_is_proxied_request()
		&& function_exists( 'is_automattician' )
		&& is_automattician()
	) {
		return true;
	}

	// Atomic sites.
	return ( new Visitor() )->is_automattician_feature_flags_only();
}

/**
 * Enqueue content-guidelines-ai script on the Content Guidelines admin page.
 *
 * @since 16.0
 *
 * @param string $hook_suffix The current admin page hook suffix.
 */
function jetpack_content_guidelines_ai_enqueue_scripts( $hook_suffix ) {
	if ( 'settings_page_guidelines-wp-admin' !== $hook_suffix ) {
		return;
	}

	// Temporarily gate to Automatticians only during internal rollout.
	if ( ! jetpack_content_guidelines_ai_is_automattician() ) {
		return;
	}

	// Only load on WordPress.com Simple and Atomic sites; self-hosted sites do
	// not enqueue at all. Free-tier Simple/Atomic sites still load the bundle so
	// the upgrade path can be shown — the paid-plan requirement is enforced by
	// the suggest-guidelines API.
	if ( ! class_exists( 'Jetpack_AI_Helper' ) ) {
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-helper.php';
	}
	if ( ! Jetpack_AI_Helper::is_enabled() ) {
		return;
	}

	// Bail when build artifacts are missing rather than enqueueing a script
	// with guessed (and likely wrong) dependencies.
	if ( ! file_exists( JETPACK__PLUGIN_DIR . '_inc/build/content-guidelines-ai.min.asset.php' ) ) {
		return;
	}

	// The bundle records Tracks events via @automattic/jetpack-analytics,
	// which only queues into window._tkq. Enqueue the Tracks client (w.js)
	// so events send without relying on whichever platform widgets happen
	// to load it.
	Tracking::register_tracks_functions_scripts( true );

	// Handles dependencies/version from the asset file, JS translations for
	// the text domain, the CSS (including the .rtl.css variant), and style
	// dependencies derived from the script's.
	Assets::register_script(
		'jetpack-content-guidelines-ai',
		'_inc/build/content-guidelines-ai.min.js',
		JETPACK__PLUGIN_FILE,
		array(
			'in_footer'  => true,
			'textdomain' => 'jetpack',
			'css_path'   => '_inc/build/content-guidelines-ai.css',
			'enqueue'    => true,
		)
	);
}

add_action( 'admin_enqueue_scripts', 'jetpack_content_guidelines_ai_enqueue_scripts' );
