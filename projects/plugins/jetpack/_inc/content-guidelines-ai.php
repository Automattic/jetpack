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
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Tracking;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
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

	// Content Guidelines AI is only offered on WordPress.com platform sites
	// (Simple and Atomic) — a hard gate the jetpack_ai_enabled filter below
	// cannot widen. Free-tier Simple/Atomic sites still load the bundle so
	// the upgrade path can be shown — the paid-plan requirement is enforced
	// by the suggest-guidelines API.
	if ( ! ( new Host() )->is_wpcom_platform() ) {
		return;
	}

	// Bail when Jetpack AI is disabled for the site: the AI settings master
	// switch and other site-wide disables ride this filter.
	/** This filter is documented in projects/plugins/jetpack/_inc/lib/class-jetpack-ai-helper.php */
	if ( ! apply_filters( 'jetpack_ai_enabled', true ) ) {
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

	// Jetpack_AI_Helper backs both preloaded values below: the per-user
	// "banner dismissed" flag and the AI feature state.
	if ( ! class_exists( 'Jetpack_AI_Helper' ) && is_readable( JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-helper.php' ) ) {
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-helper.php';
	}

	// Preload the per-user "banner dismissed" flag so the empty-state banner
	// doesn't flash before an async read. Persisted via the
	// guidelines-banner-dismissed REST endpoint, but read via Jetpack_AI_Helper
	// rather than the endpoint class: on Simple sites the wpcom-endpoints
	// classes are only loaded in REST requests, so a class_exists() check on
	// the endpoint always failed here and permanently suppressed the banner
	// and upgrade notice.
	$initial_state = array(
		'bannerDismissed' => class_exists( 'Jetpack_AI_Helper' ) && Jetpack_AI_Helper::is_guidelines_banner_dismissed(),
	);

	// Resolve the AI feature state server-side so the bundle can hydrate the
	// wordpress-com/plans store at boot and render the correct locked/unlocked
	// buttons on first paint, with no client-side plan fetch. On WordPress.com
	// Simple this is a synchronous local lookup; on Atomic/self-hosted it is
	// transient-cached with a blocking remote refresh when cold. On failure
	// the key is omitted and the bundle renders no AI UI for this load (fail
	// closed) rather than guessing.
	if ( class_exists( 'Jetpack_AI_Helper' ) ) {
		$ai_feature = Jetpack_AI_Helper::get_ai_assistance_feature();
		if ( ! is_wp_error( $ai_feature ) ) {
			$initial_state['aiFeature'] = $ai_feature;
		}
	}

	wp_add_inline_script(
		'jetpack-content-guidelines-ai',
		'window.jetpackContentGuidelinesAi = ' . wp_json_encode(
			$initial_state,
			JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
		) . ';',
		'before'
	);
}

add_action( 'admin_enqueue_scripts', 'jetpack_content_guidelines_ai_enqueue_scripts' );
