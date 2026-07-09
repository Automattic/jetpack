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

	// Preload the per-user "banner dismissed" flag so the empty-state banner
	// doesn't flash before an async read. Persisted via the
	// guidelines-banner-dismissed REST endpoint. Defaults to dismissed so a
	// load error hides the banner rather than showing it on every visit.
	$banner_dismissed = class_exists( 'WPCOM_REST_API_V2_Endpoint_Guidelines_Banner_Dismissed' )
		? WPCOM_REST_API_V2_Endpoint_Guidelines_Banner_Dismissed::is_dismissed()
		: true;
	wp_add_inline_script(
		'jetpack-content-guidelines-ai',
		'window.jetpackContentGuidelinesAi = ' . wp_json_encode(
			array( 'bannerDismissed' => $banner_dismissed ),
			JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
		) . ';',
		'before'
	);
}

add_action( 'admin_enqueue_scripts', 'jetpack_content_guidelines_ai_enqueue_scripts' );
